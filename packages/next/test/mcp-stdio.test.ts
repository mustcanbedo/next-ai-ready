import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runMcpStdio } from "../src/cli/mcp-stdio.js";

const require = createRequire(import.meta.url);

function hasMcpSdk(): boolean {
  try {
    require.resolve("@modelcontextprotocol/sdk/server/mcp.js");
    return true;
  } catch {
    return false;
  }
}

describe("runMcpStdio()", () => {
  it("throws when ai-ready.config.mjs is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nair-mcp-stdio-"));
    try {
      await expect(runMcpStdio({ cwd: dir })).rejects.toThrow(/No ai-ready.config.mjs found/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it.skipIf(!hasMcpSdk())(
    "loads config and reports ready on stderr when MCP SDK is installed",
    async () => {
      const dir = await mkdtemp(join(tmpdir(), "nair-mcp-stdio-"));
      await writeFile(
        join(dir, "ai-ready.config.mjs"),
        `export default { site: { name: "X", baseUrl: "https://x.test" }, content: [] };\n`,
        "utf8",
      );

      const stderr: string[] = [];
      const origWrite = process.stderr.write.bind(process.stderr);
      process.stderr.write = ((chunk, ...args) => {
        stderr.push(String(chunk));
        return origWrite(chunk, ...(args as Parameters<typeof process.stderr.write>));
      }) as typeof process.stderr.write;

      try {
        const running = runMcpStdio({ cwd: dir, noResources: true });
        await Promise.race([
          running,
          new Promise<void>((resolve) => setTimeout(resolve, 500)),
        ]);
        expect(stderr.join("")).toMatch(/MCP stdio server ready/);
      } finally {
        process.stderr.write = origWrite;
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});
