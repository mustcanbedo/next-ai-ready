import type { ActionsManifest } from "@next-ai-ready/core";

/**
 * Build `tools.json` in OpenAI's function-calling format (also widely
 * compatible with Anthropic Claude and Gemini "tools" APIs).
 *
 * Each public action becomes:
 *
 * ```json
 * {
 *   "type": "function",
 *   "function": {
 *     "name": "search_products",
 *     "description": "<description> ... When to use: <whenToUse>",
 *     "parameters": <inputSchema>
 *   }
 * }
 * ```
 *
 * We fold `whenToUse` into the description because most clients don't
 * understand extra metadata — the description is the only field models
 * actually read for tool selection.
 *
 * @since 0.1.0-alpha.6 — Removed unused `_site` parameter (breaking change).
 */
export function buildToolsJson(manifest: ActionsManifest): { tools: Array<Record<string, unknown>> } {
  const tools = manifest.actions
    .filter((a) => a.public)
    .map((a) => ({
      type: "function",
      function: {
        name: a.name,
        description: combineDescription(a.description, a.whenToUse, a.whenNotToUse),
        parameters: a.inputSchema,
      },
    }));
  return { tools };
}

function combineDescription(desc: string, whenToUse?: string, whenNotToUse?: string): string {
  const parts = [desc.trim()];
  if (whenToUse) parts.push(`Use when: ${whenToUse.trim()}`);
  if (whenNotToUse) parts.push(`Do not use when: ${whenNotToUse.trim()}`);
  return parts.join(" ");
}
