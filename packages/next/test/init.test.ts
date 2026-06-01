import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/cli/init.js";

async function makeTempProject() {
  const dir = await mkdtemp(join(tmpdir(), "nair-init-"));
  return {
    dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

describe("runInit()", () => {
  it("creates config + handler stubs in an empty project", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.written).toContain("ai-ready.config.mjs");
      expect(result.written).toContain("app/_ai-ready/llms-txt/route.ts");
      expect(result.written).toContain("app/_ai-ready/md/[...path]/route.ts");
      expect(result.written).toContain("app/api/actions/[name]/route.ts");
      expect(result.written).toContain("app/api/mcp/[transport]/route.ts");
      expect(result.written).toContain("actions/index.mjs");
      expect(result.written).toContain("instrumentation.ts");

      const actionRoute = await readFile(join(dir, "app/api/actions/[name]/route.ts"), "utf8");
      expect(actionRoute).toContain('../../../../actions/index.mjs');
      expect(actionRoute).not.toContain("@/actions");
      expect(result.skipped).toHaveLength(0);

      const handler = await readFile(join(dir, "app/_ai-ready/llms-txt/route.ts"), "utf8");
      expect(handler).toContain('next-ai-ready/handlers/llms-txt');

      const mcp = await readFile(join(dir, "app/api/mcp/[transport]/route.ts"), "utf8");
      expect(mcp).toContain("next-ai-ready/handlers/mcp");
    } finally {
      await cleanup();
    }
  });

  it("skips existing files unless --force is set", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await runInit({ cwd: dir, silent: true });
      const second = await runInit({ cwd: dir, silent: true });
      expect(second.written).toHaveLength(0);
      expect(second.skipped.length).toBeGreaterThan(0);

      const forced = await runInit({ cwd: dir, force: true, silent: true });
      expect(forced.written.length).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });

  it("patches existing next.config.mjs with withAiReady()", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await writeFile(
        join(dir, "next.config.mjs"),
        `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;\n`,
        "utf8",
      );
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.patched).toContain("next.config.mjs");

      const config = await readFile(join(dir, "next.config.mjs"), "utf8");
      expect(config).toContain('import { withAiReady } from "next-ai-ready"');
      expect(config).toContain("withAiReady()(");
      expect(config).toContain("reactStrictMode");
    } finally {
      await cleanup();
    }
  });

  it("skips config patch when withAiReady already present", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await writeFile(
        join(dir, "next.config.mjs"),
        `import { withAiReady } from "@next-ai-ready/next";\nexport default withAiReady()({});\n`,
        "utf8",
      );
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.patched).not.toContain("next.config.mjs");
    } finally {
      await cleanup();
    }
  });

  it("creates next.config.mjs when none exists", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.patched).toContain("next.config.mjs (created)");

      const config = await readFile(join(dir, "next.config.mjs"), "utf8");
      expect(config).toContain("withAiReady");
    } finally {
      await cleanup();
    }
  });

  it("patches next.config.ts with withAiReady()", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await writeFile(
        join(dir, "next.config.ts"),
        `import type { NextConfig } from "next";\n\nconst config: NextConfig = {\n  reactStrictMode: true,\n};\n\nexport default config;\n`,
        "utf8",
      );
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.patched).toContain("next.config.ts");

      const config = await readFile(join(dir, "next.config.ts"), "utf8");
      expect(config).toContain('import { withAiReady } from "next-ai-ready"');
      expect(config).toContain("withAiReady()(");
    } finally {
      await cleanup();
    }
  });

  it("patches package.json build + typecheck scripts", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await mkdir(join(dir, "node_modules"), { recursive: true }); // fake project
      await writeFile(
        join(dir, "package.json"),
        JSON.stringify({ scripts: { build: "next build", dev: "next dev" } }, null, 2) + "\n",
        "utf8",
      );
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.patched).toContain("package.json");

      const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      expect(pkg.scripts.build).toContain("next-ai-ready build");
      expect(pkg.scripts.build).toContain("next build");
      expect(pkg.scripts.typecheck).toBe("tsc --noEmit");
      expect(pkg.scripts.dev).toBe("next dev"); // preserved
    } finally {
      await cleanup();
    }
  });

  it("generates TypeScript actions when tsconfig.json exists", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await writeFile(join(dir, "tsconfig.json"), `{"compilerOptions":{"strict":true}}\n`, "utf8");
      const result = await runInit({ cwd: dir, silent: true });
      expect(result.written).toContain("actions/index.ts");
      expect(result.written).toContain("ai-ready.config.ts");
    } finally {
      await cleanup();
    }
  });

  it("does not double-patch package.json build script", async () => {
    const { dir, cleanup } = await makeTempProject();
    try {
      await writeFile(
        join(dir, "package.json"),
        JSON.stringify({ scripts: { build: "next-ai-ready build && next build" } }, null, 2) + "\n",
        "utf8",
      );
      const result = await runInit({ cwd: dir, silent: true });
      // Should still patch for typecheck, but build is unchanged
      const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      expect(pkg.scripts.build).toBe("next-ai-ready build && next build");
    } finally {
      await cleanup();
    }
  });
});
