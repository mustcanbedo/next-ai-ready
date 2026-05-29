import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineAction, clearRegistry } from "@next-ai-ready/actions";
import type { InvokeInfo } from "@next-ai-ready/core";
import { runDoctor } from "../src/cli/doctor.js";
import { runBuild } from "../src/cli/build.js";
import { POST as actionPOST } from "../src/handlers/action.js";
import { registerAiHooks, clearAiHooks } from "../src/runtime/observability.js";
import { publicRobotsTxtPath } from "../src/paths.js";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "fixtures", "sample-app");

const CONFIG = `export default {
  site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
  content: ["content/**/*.mdx"],
};
`;

async function makeProject(config = CONFIG) {
  const dir = await mkdtemp(join(tmpdir(), "nair-doctor-"));
  await writeFile(join(dir, "ai-ready.config.mjs"), config, "utf8");
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

describe("runDoctor()", () => {
  it("errors when no config exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nair-doctor-empty-"));
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.errors).toBeGreaterThan(0);
      expect(r.diagnostics[0].message).toContain("No ai-ready.config.mjs");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("passes a valid config but warns about missing build + routes", async () => {
    const { dir, cleanup } = await makeProject();
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.errors).toBe(0);
      expect(r.warnings).toBeGreaterThan(0);
      const msgs = r.diagnostics.map((d) => d.message).join("\n");
      expect(msgs).toContain("Found ai-ready.config.mjs");
      expect(msgs).toContain("No graph.json yet");
      expect(msgs).toContain("No actions configured");
    } finally {
      await cleanup();
    }
  });

  it("flags a bad baseUrl as an error", async () => {
    const bad = `export default { site: { name: "X", baseUrl: "doc.test" }, content: [] };\n`;
    const { dir, cleanup } = await makeProject(bad);
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.errors).toBeGreaterThan(0);
      expect(r.diagnostics.some((d) => d.message.includes("absolute URL"))).toBe(true);
    } finally {
      await cleanup();
    }
  });
});

describe("runBuild() — robots.txt", () => {
  afterEach(async () => {
    await rm(join(SAMPLE, ".next-ai-ready"), { recursive: true, force: true });
    await rm(join(SAMPLE, "public"), { recursive: true, force: true });
  });

  it("emits public/robots.txt with AI-bot policy", async () => {
    const result = await runBuild({ cwd: SAMPLE, silent: true });
    expect(result.filesWritten).toContain(publicRobotsTxtPath(SAMPLE));
    const txt = await readFile(publicRobotsTxtPath(SAMPLE), "utf8");
    expect(txt).toContain("User-agent: GPTBot");
    expect(txt).toContain("https://sample.test/llms.txt");
  });
});

describe("observability hooks", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearAiHooks());

  it("fires onInvoke after an action call with latency + caller", async () => {
    const { registerActions } = await import("@next-ai-ready/actions");
    registerActions([
      defineAction({
        name: "echo",
        description: "Echo.",
        whenToUse: "test",
        public: true,
        input: z.object({ msg: z.string() }),
        handler: async ({ msg }) => ({ msg }),
      }),
    ]);

    const seen: InvokeInfo[] = [];
    registerAiHooks({ onInvoke: (info) => void seen.push(info) });

    await actionPOST(
      new Request("https://x/api/actions/echo", {
        method: "POST",
        body: JSON.stringify({ msg: "hi" }),
        headers: { "user-agent": "GPTBot/1.0" },
      }),
      { params: Promise.resolve({ name: "echo" }) },
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].action).toBe("echo");
    expect(seen[0].ok).toBe(true);
    expect(seen[0].caller).toBe("GPTBot");
    expect(seen[0].latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("a throwing hook never breaks the response", async () => {
    const { registerActions } = await import("@next-ai-ready/actions");
    registerActions([
      defineAction({
        name: "echo",
        description: "Echo.",
        whenToUse: "test",
        public: true,
        input: z.object({ msg: z.string() }),
        handler: async ({ msg }) => ({ msg }),
      }),
    ]);
    registerAiHooks({
      onInvoke: () => {
        throw new Error("analytics down");
      },
    });

    const resp = await actionPOST(
      new Request("https://x/api/actions/echo", { method: "POST", body: JSON.stringify({ msg: "hi" }) }),
      { params: Promise.resolve({ name: "echo" }) },
    );
    expect(resp.status).toBe(200);
  });
});
