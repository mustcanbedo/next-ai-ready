import { z } from "zod";
import type { SchemaLike } from "@next-ai-ready/core";

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
      "[next-ai-ready] Only Zod schemas are currently supported for action input/output. " +
        "If you need another validator, please open an issue.",
    );
  }
  const json = z.toJSONSchema(schema as unknown as Parameters<typeof z.toJSONSchema>[0]);
  if ("$schema" in json) delete (json as Record<string, unknown>).$schema;
  return json as Record<string, unknown>;
}

function isZodSchema(s: SchemaLike): boolean {
  return typeof s === "object" && s !== null && "_def" in s;
}
