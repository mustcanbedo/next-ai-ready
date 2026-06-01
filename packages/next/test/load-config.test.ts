import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/cli/load-config.js";

async function tempDir(prefix: string) {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

describe("loadConfig()", () => {
  it("returns null when no config file exists", async () => {
    const { dir, cleanup } = await tempDir("nair-loadcfg-empty-");
    try {
      expect(await loadConfig(dir)).toBeNull();
    } finally {
      await cleanup();
    }
  });

  it("loads ai-ready.config.mjs default export", async () => {
    const { dir, cleanup } = await tempDir("nair-loadcfg-mjs-");
    try {
      await writeFile(
        join(dir, "ai-ready.config.mjs"),
        `export default {
  site: { name: "Test", baseUrl: "https://test.dev", description: "d" },
  content: ["content/**/*.mdx"],
};
`,
        "utf8",
      );
      const config = await loadConfig(dir);
      expect(config?.site?.name).toBe("Test");
      expect(config?.site?.baseUrl).toBe("https://test.dev");
      expect(config?.content).toEqual(["content/**/*.mdx"]);
    } finally {
      await cleanup();
    }
  });

  it("prefers .mjs over .js when both exist", async () => {
    const { dir, cleanup } = await tempDir("nair-loadcfg-pref-");
    try {
      await writeFile(
        join(dir, "ai-ready.config.js"),
        `export default { site: { name: "JS", baseUrl: "https://js.dev" }, content: [] };`,
        "utf8",
      );
      await writeFile(
        join(dir, "ai-ready.config.mjs"),
        `export default { site: { name: "MJS", baseUrl: "https://mjs.dev" }, content: [] };`,
        "utf8",
      );
      const config = await loadConfig(dir);
      expect(config?.site?.name).toBe("MJS");
    } finally {
      await cleanup();
    }
  });

  it("loads ai-ready.config.ts via jiti", async () => {
    const { dir, cleanup } = await tempDir("nair-loadcfg-ts-");
    try {
      await writeFile(
        join(dir, "ai-ready.config.ts"),
        `export default {
  site: { name: "TS", baseUrl: "https://ts.dev", description: "d" },
  content: [],
};
`,
        "utf8",
      );
      const config = await loadConfig(dir);
      expect(config?.site?.name).toBe("TS");
    } finally {
      await cleanup();
    }
  });

  it("throws when default export is not an object", async () => {
    const { dir, cleanup } = await tempDir("nair-loadcfg-bad-");
    try {
      await writeFile(join(dir, "ai-ready.config.mjs"), `export default "not-a-config";\n`, "utf8");
      await expect(loadConfig(dir)).rejects.toThrow(/must export a config object/);
    } finally {
      await cleanup();
    }
  });
});
