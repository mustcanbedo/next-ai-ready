import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { AiReadyConfig } from "@next-ai-ready/core";
import { AiReadyError } from "./errors.js";

const CONFIG_CANDIDATES = ["ai-ready.config.mjs", "ai-ready.config.js", "ai-ready.config.ts"] as const;

/**
 * Locate and load the user's `ai-ready.config.{mjs,js,ts}` from a project root.
 *
 * `.ts` configs load via `jiti` (optional peer dependency). ESM `.mjs`/`.js` use native import.
 * If `jiti` is not installed and a `.ts` config is found, a clear error is thrown.
 */
export async function loadConfig(projectRoot: string): Promise<AiReadyConfig | null> {
  const root = resolve(projectRoot);
  for (const file of CONFIG_CANDIDATES) {
    const path = join(root, file);
    if (!(await fileExists(path))) continue;

    const config =
      file.endsWith(".ts") ? await loadTypeScriptConfig(path) : await loadJsConfig(path);

    if (!config || typeof config !== "object") {
      throw new AiReadyError("invalid_config", `${file} must export a config object as its default export.`, [
        "Export `export default defineConfig({ ... })` from your config file.",
      ]);
    }
    return config;
  }
  return null;
}

async function loadJsConfig(path: string): Promise<AiReadyConfig> {
  const url = pathToFileURL(path).href;
  const mod = (await import(url)) as { default?: unknown };
  return (mod.default ?? mod) as AiReadyConfig;
}

async function loadTypeScriptConfig(path: string): Promise<AiReadyConfig> {
  try {
    const { createJiti } = await import("jiti");
    const jiti = createJiti(import.meta.url, { interopDefault: true });
    return jiti(path) as AiReadyConfig;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND") {
      throw new AiReadyError(
        "missing_jiti",
        "TypeScript config file found but `jiti` is not installed.",
        [
          "Run `npm install jiti` (or `pnpm add jiti`).",
          "Or rename `ai-ready.config.ts` to `ai-ready.config.mjs`.",
        ],
      );
    }
    throw err;
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}
