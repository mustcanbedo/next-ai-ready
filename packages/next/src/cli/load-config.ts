import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { AiReadyConfig } from "@next-ai-ready/core";
import { AiReadyError } from "./errors.js";
import { loadUserModule } from "./load-user-module.js";

const CONFIG_CANDIDATES = ["ai-ready.config.mjs", "ai-ready.config.js", "ai-ready.config.ts"] as const;

/**
 * Locate and load the user's `ai-ready.config.{mjs,js,ts}` from a project root.
 *
 * TypeScript configs load through the package's `jiti` runtime dependency.
 * ESM `.mjs`/`.js` configs continue to use native import.
 */
export async function loadConfig(projectRoot: string): Promise<AiReadyConfig | null> {
  const root = resolve(projectRoot);
  for (const file of CONFIG_CANDIDATES) {
    const path = join(root, file);
    if (!(await fileExists(path))) continue;

    const config = (await loadUserModule(path, { default: true })) as AiReadyConfig;

    if (!config || typeof config !== "object") {
      throw new AiReadyError("invalid_config", `${file} must export a config object as its default export.`, [
        "Export `export default defineConfig({ ... })` from your config file.",
      ]);
    }
    return config;
  }
  return null;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}
