import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { graphPath, publicRobotsTxtPath, publicOpenApiPath, ROUTE_STUBS } from "../src/paths.js";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "fixtures", "sample-app");
const CAPABILITY_ROUTES = [
  ["OpenAPI", ROUTE_STUBS.OPENAPI],
  ["MCP", ROUTE_STUBS.MCP],
  ["Actions", ROUTE_STUBS.ACTION],
  ["Tools", ROUTE_STUBS.TOOLS],
  ["AI plugin", "app/%5Fai-ready/ai-plugin/route.ts"],
] as const;
const ROUTE_EXTENSIONS = ["ts", "tsx", "js", "jsx", "mjs"] as const;

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

async function makeReadyDoctorProject(config = CONFIG) {
  const project = await makeProject(config);
  const { dir } = project;
  await mkdir(dirname(graphPath(dir)), { recursive: true });
  await writeFile(graphPath(dir), JSON.stringify({ routes: {}, nodes: {} }), "utf8");
  await mkdir(dirname(publicRobotsTxtPath(dir)), { recursive: true });
  await writeFile(publicRobotsTxtPath(dir), "User-agent: *\nAllow: /\n", "utf8");
  for (const route of [ROUTE_STUBS.LLMS_TXT, ROUTE_STUBS.PAGE_MD]) {
    await mkdir(dirname(join(dir, route)), { recursive: true });
    await writeFile(join(dir, route), "export const runtime = 'nodejs';\n", "utf8");
  }
  await writeFile(
    join(dir, "next.config.mjs"),
    `import { withAiReady } from "next-ai-ready";\nexport default withAiReady()({});\n`,
    "utf8",
  );
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ scripts: { build: "next-ai-ready build && next build" } }),
    "utf8",
  );
  return project;
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
      expect(msgs).toContain("valid Knowledge-only setup");
      expect(
        r.diagnostics.some(
          (diagnostic) => diagnostic.level === "ok" && diagnostic.message.includes("valid Knowledge-only setup"),
        ),
      ).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("does not penalize an intentionally Knowledge-only project", async () => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    try {
      const result = await runDoctor({ cwd: dir, json: true });
      expect(result.errors).toBe(0);
      expect(result.warnings).toBe(0);
      expect(result.score).toBe(100);
      expect(result.report?.checks.find((check) => check.id === "build-openapi")).toMatchObject({
        name: "OpenAPI artifact",
        level: "ok",
        message: expect.stringContaining("not required"),
      });
      const mcp = result.diagnostics.find((diagnostic) =>
        diagnostic.message.includes("MCP route is not installed"),
      );
      expect(mcp?.level).toBe("ok");

      const capabilityTactics = result.report?.tactics?.filter((tactic) => tactic.plane === "C") ?? [];
      expect(capabilityTactics).toHaveLength(12);
      expect(capabilityTactics.every((tactic) => tactic.level === "skip")).toBe(true);
      expect(result.actionItems).not.toContain(
        "Fix `actions` path in config or register at least one `defineAction`.",
      );
      expect(result.actionItems).not.toContain(
        "Set `NEXT_AI_READY_MCP_TOKEN` in production to protect `/api/mcp`.",
      );
      expect(result.actionItems).toEqual([]);
    } finally {
      await cleanup();
    }
  });

  it.each([
    ["empty inline actions", { actions: [] }, "ok"],
    ["an empty actions module", { actions: "./actions.mjs" }, "ok"],
    ["an unloadable actions module", { actions: "./missing-actions.mjs" }, "error"],
    ["actions with OpenAPI emission disabled", { actions: [], emit: { openapi: false } }, "ok"],
  ] as const)("warns about missing OpenAPI with %s", async (_label, capabilities, loadLevel) => {
    const config = `export default ${JSON.stringify({
      site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
      content: [],
      ...capabilities,
    })};\n`;
    const { dir, cleanup } = await makeReadyDoctorProject(config);
    try {
      await writeFile(join(dir, "actions.mjs"), "export default [];\n", "utf8");
      const result = await runDoctor({ cwd: dir, json: true });
      expect(result.report?.checks.find((check) => check.id === "actions-load")?.level).toBe(loadLevel);
      expect(result.report?.checks.find((check) => check.id === "build-openapi")).toMatchObject({
        name: "OpenAPI artifact",
        level: "warn",
        message: "No public/openapi.json yet. Run `next-ai-ready build` before deploying.",
      });
      expect(result.actionItems).toContain("Run `npx next-ai-ready build` to emit openapi.json.");

      await writeFile(publicOpenApiPath(dir), JSON.stringify({ openapi: "3.1.0", paths: {} }), "utf8");
      const built = await runDoctor({ cwd: dir, json: true });
      expect(built.report?.checks.find((check) => check.id === "actions-load")?.level).toBe(loadLevel);
      expect(built.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("ok");
      expect(built.actionItems).not.toContain("Run `npx next-ai-ready build` to emit openapi.json.");
    } finally {
      await cleanup();
    }
  });

  it.each(CAPABILITY_ROUTES.flatMap(([label, route]) =>
    ROUTE_EXTENSIONS.map((extension) => [label, join(dirname(route), `route.${extension}`)] as const),
  ))("warns about missing OpenAPI with only the %s handler at %s", async (_label, route) => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    try {
      await mkdir(dirname(join(dir, route)), { recursive: true });
      await writeFile(join(dir, route), "export const runtime = 'nodejs';\n", "utf8");
      const result = await runDoctor({ cwd: dir, json: true });
      expect(result.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("warn");
      expect(result.report?.checks.find((check) => check.id === "actions-load")?.message).not.toContain(
        "valid Knowledge-only setup",
      );
      expect(result.actionItems).toContain("Run `npx next-ai-ready build` to emit openapi.json.");

      await writeFile(publicOpenApiPath(dir), JSON.stringify({ openapi: "3.1.0", paths: {} }), "utf8");
      const built = await runDoctor({ cwd: dir, json: true });
      expect(built.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("ok");
      expect(built.actionItems).not.toContain("Run `npx next-ai-ready build` to emit openapi.json.");
    } finally {
      await cleanup();
    }
  });

  it.each(ROUTE_EXTENSIONS)("keeps MCP token diagnostics for route.%s", async (extension) => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    vi.stubEnv("NEXT_AI_READY_MCP_TOKEN", "");
    try {
      const route = join(dir, dirname(ROUTE_STUBS.MCP), `route.${extension}`);
      await mkdir(dirname(route), { recursive: true });
      await writeFile(route, "export const runtime = 'nodejs';\n", "utf8");
      const missing = await runDoctor({ cwd: dir, json: true });
      expect(missing.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("warn");
      expect(missing.report?.checks.find((check) => check.id === "mcp-token")?.level).toBe("warn");
      expect(missing.actionItems).toContain("Run `npx next-ai-ready build` to emit openapi.json.");
      expect(missing.actionItems).toContain(
        "Set `NEXT_AI_READY_MCP_TOKEN` in production to protect `/api/mcp`.",
      );

      await writeFile(publicOpenApiPath(dir), JSON.stringify({ openapi: "3.1.0", paths: {} }), "utf8");
      const built = await runDoctor({ cwd: dir, json: true });
      expect(built.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("ok");
      expect(built.report?.checks.find((check) => check.id === "mcp-token")?.level).toBe("warn");

      vi.stubEnv("NEXT_AI_READY_MCP_TOKEN", "doctor-test-token");
      const configured = await runDoctor({ cwd: dir, json: true });
      expect(configured.report?.checks.find((check) => check.id === "mcp-token")?.level).toBe("ok");
      expect(configured.warnings).toBe(0);
      expect(configured.score).toBe(100);
      expect(configured.actionItems).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
      await cleanup();
    }
  });

  it("preserves the OpenAPI check ID and score weight for a capability project", async () => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    try {
      await mkdir(dirname(join(dir, ROUTE_STUBS.OPENAPI)), { recursive: true });
      await writeFile(join(dir, ROUTE_STUBS.OPENAPI), "export const runtime = 'nodejs';\n", "utf8");
      const missing = await runDoctor({ cwd: dir, json: true });
      expect(missing.warnings).toBe(1);
      expect(missing.score).toBe(95);
      expect(missing.actionItems).toEqual(["Run `npx next-ai-ready build` to emit openapi.json."]);

      await writeFile(publicOpenApiPath(dir), JSON.stringify({ openapi: "3.1.0", paths: {} }), "utf8");
      const built = await runDoctor({ cwd: dir, json: true });
      expect(built.warnings).toBe(0);
      expect(built.score).toBe(100);
      expect(built.report?.checks.map((check) => check.id)).toEqual(
        missing.report?.checks.map((check) => check.id),
      );
      expect(built.report?.checks.find((check) => check.id === "build-openapi")?.message).toBe(
        "Canonical artifact public/openapi.json present.",
      );
    } finally {
      await cleanup();
    }
  });

  it("accepts an existing OpenAPI artifact without capability configuration", async () => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    try {
      await writeFile(publicOpenApiPath(dir), JSON.stringify({ openapi: "3.1.0", paths: {} }), "utf8");
      const result = await runDoctor({ cwd: dir, json: true });
      expect(result.report?.checks.find((check) => check.id === "build-openapi")).toMatchObject({
        level: "ok",
        message: "Canonical artifact public/openapi.json present.",
      });
      expect(result.warnings).toBe(0);
      expect(result.actionItems).toEqual([]);
    } finally {
      await cleanup();
    }
  });

  it("does not mistake a directory for a capability handler or OpenAPI artifact", async () => {
    const { dir, cleanup } = await makeReadyDoctorProject();
    try {
      for (const [, route] of CAPABILITY_ROUTES) {
        for (const extension of ROUTE_EXTENSIONS) {
          await mkdir(join(dir, dirname(route), `route.${extension}`), { recursive: true });
        }
      }
      await mkdir(publicOpenApiPath(dir));
      const result = await runDoctor({ cwd: dir, json: true });
      expect(result.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("ok");
      expect(result.report?.checks.find((check) => check.id === "mcp-token")?.level).toBe("ok");
      expect(result.warnings).toBe(0);
      expect(result.actionItems).toEqual([]);

      await rm(join(dir, ROUTE_STUBS.OPENAPI), { recursive: true });
      await writeFile(join(dir, ROUTE_STUBS.OPENAPI), "export const runtime = 'nodejs';\n", "utf8");
      const capability = await runDoctor({ cwd: dir, json: true });
      expect(capability.report?.checks.find((check) => check.id === "build-openapi")?.level).toBe("warn");
      expect(capability.actionItems).toContain("Run `npx next-ai-ready build` to emit openapi.json.");
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

  it("does not warn missing public/robots.txt when app/robots.ts and emit.robots false", async () => {
    const config = `export default {
  site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
  content: ["content/**/*.mdx"],
  emit: { robots: false },
};
`;
    const { dir, cleanup } = await makeProject(config);
    await mkdir(join(dir, "app"), { recursive: true });
    await writeFile(
      join(dir, "app", "robots.ts"),
      `export default function robots() { return { rules: [{ userAgent: "*", allow: "/" }] }; }\n`,
      "utf8",
    );
    try {
      const r = await runDoctor({ cwd: dir, score: true });
      expect(r.diagnostics.some((d) => d.message.includes("No public/robots.txt found"))).toBe(false);
      expect(
        r.diagnostics.some((d) => d.level === "ok" && d.message.includes("app/robots.ts")),
      ).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("accepts blocking training bots while keeping AI search visible", async () => {
    const config = `export default {
  site: { name: "Doc", baseUrl: "https://doc.test", description: "x" },
  content: ["content/**/*.mdx"],
  robots: { aiBots: { search: "allow", training: "disallow", user: "allow" } },
};
`;
    const { dir, cleanup } = await makeProject(config);
    try {
      await runBuild({ cwd: dir, silent: true });
      const result = await runDoctor({ cwd: dir, score: true });
      const robotsCheck = result.diagnostics.find((diagnostic) =>
        diagnostic.message.includes("AI search and user-requested retrieval bots"),
      );

      expect(robotsCheck?.level).toBe("ok");
      expect(robotsCheck?.message).toContain("Training access is independently disabled");
    } finally {
      await cleanup();
    }
  });

  it("reports only visibility bots whose own robots group blocks access", async () => {
    const { dir, cleanup } = await makeProject();
    await mkdir(join(dir, "public"), { recursive: true });
    await writeFile(
      join(dir, "public", "robots.txt"),
      [
        "User-agent: OAI-SearchBot",
        "Disallow: /",
        "",
        "User-agent: GPTBot",
        "Allow: /",
        "",
        "User-agent: Claude-SearchBot",
        "Allow: /",
        "",
      ].join("\n"),
      "utf8",
    );
    try {
      const result = await runDoctor({ cwd: dir, score: true });
      const robotsCheck = result.diagnostics.find((diagnostic) =>
        diagnostic.message.includes("may reduce AI discoverability"),
      );

      expect(robotsCheck?.level).toBe("warn");
      expect(robotsCheck?.message).toContain("OAI-SearchBot");
      expect(robotsCheck?.message).not.toContain("GPTBot");
      expect(robotsCheck?.message).not.toContain("Claude-SearchBot");
    } finally {
      await cleanup();
    }
  });

  it("includes actionItems when --json is set", async () => {
    const { dir, cleanup } = await makeProject();
    try {
      const r = await runDoctor({ cwd: dir, json: true });
      expect(r.report?.actionItems).toBeDefined();
      expect(Array.isArray(r.report!.actionItems)).toBe(true);
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
