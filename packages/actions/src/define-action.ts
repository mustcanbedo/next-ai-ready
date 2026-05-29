import type { ActionDefinition, SchemaLike } from "@next-ai-ready/core";

/**
 * Author an action.
 *
 * ```ts
 * import { defineAction } from "@next-ai-ready/actions"
 * import { z } from "zod"
 *
 * export const search = defineAction({
 *   name: "search_products",
 *   description: "Full-text search across the product catalogue.",
 *   whenToUse: "When the user asks to find a product by name or feature.",
 *   public: true,
 *   input: z.object({ query: z.string().min(1), limit: z.number().int().max(50).optional() }),
 *   output: z.object({ items: z.array(z.object({ id: z.string(), title: z.string() })) }),
 *   handler: async ({ query, limit = 10 }) => ({ items: await search(query, limit) }),
 * })
 * ```
 *
 * Identity-typed: validation and registry insertion happen in `registry.ts`
 * (called by `defineActions()`), not here. This keeps `defineAction` a
 * compile-time-only construct so it tree-shakes cleanly.
 */
export function defineAction<I, O>(def: ActionDefinition<I, O>): ActionDefinition<I, O> {
  if (!/^[a-z][a-z0-9_]*$/.test(def.name)) {
    throw new Error(
      `[next-ai-ready] Action name "${def.name}" must be snake_case (lowercase letters, digits, underscores).`,
    );
  }
  return def;
}

/** Re-export for downstream packages that don't want to depend on core directly. */
export type { ActionDefinition, SchemaLike };
