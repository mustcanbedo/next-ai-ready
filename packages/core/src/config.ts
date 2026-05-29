import type { AiReadyConfig } from "./types.js";

/**
 * Identity helper for typed config authoring.
 *
 * ```ts
 * // ai-ready.config.ts
 * import { defineConfig } from "@next-ai-ready/core"
 * export default defineConfig({ site: { name: "Acme", baseUrl: "https://acme.com" } })
 * ```
 */
export function defineConfig(config: AiReadyConfig): AiReadyConfig {
  return config;
}

/** Defaults applied when fields are omitted. Pure; safe to call repeatedly. */
export function withDefaults(config: AiReadyConfig): Required<Pick<AiReadyConfig, "content">> & AiReadyConfig {
  return {
    content: ["app/**/*.{md,mdx}", "content/**/*.mdx"],
    ...config,
  };
}
