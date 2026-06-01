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
import { publicRobotsTxtPath, publicOpenApiPath } from "../src/paths.js";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "fixtures", "sample-app");

const CONFIG = `export default {
  site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
  content: ["content/**/*.mdx"],
};
`;

const CONFIG_WITH_ACTIONS = `import { defineAction } from "@next-ai-ready/actions";
import { z } from "zod";
export default {
  site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
  content: ["content/**/*.mdx"],
  actions: [
    defineAction({
      name: "test_action",
      description: "A test action.",
      whenToUse: "For testing.",
      public: true,
      input: z.object({ q: z.string() }),
      handler: async ({ q }) => ({ answer: q }),
    }),
  ],
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

  it("warns when next.config does not include withAiReady (U-05)", async () => {
    const { dir, cleanup } = await makeProject();
    await writeFile(join(dir, "next.config.mjs"), `export default {};\n`, "utf8");
    try {
      const r = await runDoctor({ cwd: dir });
      const msgs = r.diagnostics.map((d) => d.message).join("\n");
      expect(msgs).toContain("withAiReady");
      expect(r.diagnostics.some((d) => d.level === "warn" && d.message.includes("withAiReady"))).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("passes next.config check when withAiReady is present", async () => {
    const { dir, cleanup } = await makeProject();
    await writeFile(
      join(dir, "next.config.mjs"),
      `import { withAiReady } from "next-ai-ready";\nexport default withAiReady()({});\n`,
      "utf8",
    );
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.diagnostics.some((d) => d.level === "ok" && d.message.includes("withAiReady"))).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("warns when package.json build script lacks next-ai-ready build", async () => {
    const { dir, cleanup } = await makeProject();
    await writeFile(join(dir, "package.json"), JSON.stringify({ scripts: { build: "next build" } }), "utf8");
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.diagnostics.some((d) => d.level === "warn" && d.message.includes("next-ai-ready build"))).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("passes build script check when prebuild has next-ai-ready build", async () => {
    const { dir, cleanup } = await makeProject();
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify({ scripts: { build: "next build", prebuild: "next-ai-ready build" } }),
      "utf8",
    );
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.diagnostics.some((d) => d.level === "ok" && d.message.includes("next-ai-ready build"))).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("includes score when --score flag is set", async () => {
    const { dir, cleanup } = await makeProject();
    try {
      const r = await runDoctor({ cwd: dir, score: true });
      expect(r.score).toBeDefined();
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    } finally {
      await cleanup();
    }
  });

  it("emits JSON report when --json flag is set", async () => {
    const { dir, cleanup } = await makeProject();
    try {
      const r = await runDoctor({ cwd: dir, json: true });
      expect(r.report).toBeDefined();
      expect(r.report!.version).toBe("1");
      expect(r.report!.checks.length).toBeGreaterThan(0);
      expect(r.report!.summary.total).toBe(r.report!.checks.length);
      expect(r.report!.score).toBeGreaterThanOrEqual(0);
    } finally {
      await cleanup();
    }
  });

  it("warns about missing updatedAt in graph (T-01)", async () => {
    const { dir, cleanup } = await makeProject(CONFIG_WITH_ACTIONS);
    // Create a content file without updatedAt/author to trigger warnings.
    await mkdir(join(dir, "content"), { recursive: true });
    await writeFile(
      join(dir, "content", "test.mdx"),
      `---\ntitle: Test\nsummary: A test page.\n---\n\n# Test\n\nHello world.\n`,
      "utf8",
    );
    try {
      await runBuild({ cwd: dir, silent: true });
      const r = await runDoctor({ cwd: dir, score: true });
      const msgs = r.diagnostics.map((d) => d.message).join("\n");
      // The content has no updatedAt/author in frontmatter, so doctor warns.
      expect(msgs).toMatch(/updatedAt|author/);
    } finally {
      await cleanup();
    }
  });

  it("warns when content declares noai (T-02)", async () => {
    const { dir, cleanup } = await makeProject();
    await mkdir(join(dir, "content"), { recursive: true });
    await writeFile(
      join(dir, "content", "secret.mdx"),
      `---\ntitle: Secret\nnoai: true\n---\n\n# Secret\n`,
      "utf8",
    );
    try {
      const r = await runDoctor({ cwd: dir });
      expect(r.diagnostics.some((d) => d.message.includes("noai"))).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("warns when graph pages lack JSON-LD helpers (T-02)", async () => {
    const { dir, cleanup } = await makeProject(CONFIG_WITH_ACTIONS);
    await mkdir(join(dir, "content"), { recursive: true });
    await writeFile(
      join(dir, "content", "test.mdx"),
      `---\ntitle: Test\nsummary: A test page.\n---\n\n# Test\n`,
      "utf8",
    );
    try {
      await runBuild({ cwd: dir, silent: true });
      const r = await runDoctor({ cwd: dir });
      expect(r.diagnostics.some((d) => d.message.includes("JSON-LD") || d.message.includes("getPageJsonLd"))).toBe(
        true,
      );
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
