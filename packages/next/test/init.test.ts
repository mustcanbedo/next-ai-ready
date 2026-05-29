import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
      expect(result.skipped).toHaveLength(0);

      const handler = await readFile(join(dir, "app/_ai-ready/llms-txt/route.ts"), "utf8");
      expect(handler).toContain('@next-ai-ready/next/handlers/llms-txt');

      const mcp = await readFile(join(dir, "app/api/mcp/[transport]/route.ts"), "utf8");
      expect(mcp).toContain("createAiReadyMcpHandler");
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
});
