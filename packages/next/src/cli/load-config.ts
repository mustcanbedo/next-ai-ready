import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { AiReadyConfig } from "@next-ai-ready/core";

/**
 * Locate and load the user's `ai-ready.config.{mjs,js}` from a project root.
 *
 * Current scope: only ESM JavaScript (`.mjs` / `.js` with `"type": "module"`).
 * TypeScript config files (`.ts`) are not yet supported. A future release
 * will add `tsx`/`jiti` as a lazy peer dependency for `.ts` config loading.
 *
 * Returns `null` when no config file exists; the caller decides whether
 * defaults are acceptable.
 */
export async function loadConfig(projectRoot: string): Promise<AiReadyConfig | null> {
  const root = resolve(projectRoot);
  for (const file of ["ai-ready.config.mjs", "ai-ready.config.js"]) {
    const path = join(root, file);
    if (await fileExists(path)) {
      const url = pathToFileURL(path).href;
      const mod = (await import(url)) as { default?: unknown };
      const config = (mod.default ?? mod) as AiReadyConfig;
      if (!config || typeof config !== "object") {
        throw new Error(`${file} must export a config object as its default export.`);
      }
      return config;
    }
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
