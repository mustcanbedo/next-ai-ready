import type {
  ActionDefinition,
  ActionManifestEntry,
  ActionsManifest,
} from "@next-ai-ready/core";
import { schemaToJsonSchema } from "./schema.js";
import { listActions } from "./registry.js";

/**
 * Serialize the current registry into an `ActionsManifest`.
 *
 * The manifest is the contract between build-time and emission-time tools
 * (OpenAPI, MCP, llms.txt action callouts). It contains *no functions* —
 * just metadata + JSON Schemas — so it's safe to bundle into a serverless
 * function or ship to a CDN.
 */
export function buildActionsManifest(): ActionsManifest {
  const entries = listActions()
    .map(toEntry)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { actions: entries, generatedAt: new Date().toISOString() };
}

function toEntry(def: ActionDefinition<unknown, unknown>): ActionManifestEntry {
  return {
    name: def.name,
    description: def.description,
    whenToUse: def.whenToUse,
    whenNotToUse: def.whenNotToUse,
    tags: def.tags,
    public: def.public === true,
    inputSchema: schemaToJsonSchema(def.input),
    outputSchema: def.output ? schemaToJsonSchema(def.output) : undefined,
    examples: def.examples,
  };
}
