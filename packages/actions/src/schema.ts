import { z } from "zod";
import type { SchemaLike } from "@next-ai-ready/core";

/**
 * Returns true when `schema` looks like a Zod v4 schema (C-50).
 * Uses structural checks instead of relying solely on `_def`.
 * Zod v3 has `_def`, Zod v4 has `_zod`.
 */
export function isZodSchema(schema: SchemaLike): boolean {
  if (typeof schema !== "object" || schema === null) return false;
  if (typeof schema.safeParse !== "function" || typeof schema.parse !== "function") return false;
  // Zod v4 uses `_zod`, v3 uses `_def` — only v4 is supported.
  return "_zod" in schema;
}

/**
 * Convert a Zod schema to JSON Schema 2020-12.
 *
 * Implementation note: we use Zod v4's built-in `z.toJSONSchema()`. We do
 * NOT depend on the older `zod-to-json-schema` package — it targets Zod v3
 * and silently emits empty objects when fed Zod v4 schemas. If a user passes
 * a non-Zod `SchemaLike`, we fail loudly so build artifacts can never be
 * silently empty.
 *
 * The output is OpenAPI 3.1 / JSON Schema 2020-12 compatible. We strip the
 * `$schema` header since each action gets inlined into a larger document.
 */
export function schemaToJsonSchema(schema: SchemaLike): Record<string, unknown> {
  if (!isZodSchema(schema)) {
    throw new Error(
      "[next-ai-ready] Only Zod v4 schemas are supported for action input/output. " +
        "Install `zod@^4` and define actions with `z.object(...)` etc. Zod v3 is not supported.",
    );
  }
  const json = z.toJSONSchema(schema as unknown as Parameters<typeof z.toJSONSchema>[0]);
  if ("$schema" in json) delete (json as Record<string, unknown>).$schema;
  return json as Record<string, unknown>;
}
