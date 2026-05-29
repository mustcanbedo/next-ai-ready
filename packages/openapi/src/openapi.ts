import type { ActionsManifest, SiteInfo } from "@next-ai-ready/core";

export interface BuildOpenApiOptions {
  /** Path prefix for action endpoints. Default: "/api/actions". */
  basePath?: string;
  /** OpenAPI document version. Default: "1.0.0". */
  version?: string;
  /** Additional servers to advertise. The first entry is always `site.baseUrl`. */
  extraServers?: { url: string; description?: string }[];
}

/**
 * Build an OpenAPI 3.1 document from an `ActionsManifest`.
 *
 * Every public action becomes a `POST /<basePath>/<name>` operation with:
 *   • `operationId: <name>`
 *   • `summary: <description>`
 *   • `description: <whenToUse>` (when present)
 *   • `x-ai-when-to-use` and `x-ai-when-not-to-use` extensions
 *   • Request body = `inputSchema`
 *   • 200 response = `outputSchema` (or empty object schema when absent)
 *   • 4xx/5xx responses for invalid input / unauthorized / handler error
 *
 * Why OpenAPI 3.1? It's a strict superset of JSON Schema 2020-12, which is
 * what `z.toJSONSchema()` emits — so schemas drop in verbatim.
 */
export function buildOpenApi(
  manifest: ActionsManifest,
  site: SiteInfo,
  opts: BuildOpenApiOptions = {},
): Record<string, unknown> {
  const basePath = (opts.basePath ?? "/api/actions").replace(/\/+$/, "");
  const version = opts.version ?? "1.0.0";

  const paths: Record<string, unknown> = {};
  for (const action of manifest.actions) {
    if (!action.public) continue; // private actions never appear in OpenAPI
    paths[`${basePath}/${action.name}`] = {
      post: {
        operationId: action.name,
        summary: action.description,
        ...(action.whenToUse ? { description: action.whenToUse } : {}),
        ...(action.tags ? { tags: action.tags } : {}),
        ...(action.whenToUse ? { "x-ai-when-to-use": action.whenToUse } : {}),
        ...(action.whenNotToUse ? { "x-ai-when-not-to-use": action.whenNotToUse } : {}),
        ...(action.examples
          ? { "x-ai-examples": action.examples }
          : {}),
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: action.inputSchema },
          },
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: action.outputSchema ?? { type: "object" },
              },
            },
          },
          "400": { description: "Invalid input", content: errorContent() },
          "401": { description: "Unauthorized", content: errorContent() },
          "500": { description: "Handler error", content: errorContent() },
        },
      },
    };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${site.name} — AI Actions`,
      version,
      ...(site.description ? { description: site.description } : {}),
    },
    servers: [
      { url: site.baseUrl, description: site.name },
      ...(opts.extraServers ?? []),
    ],
    paths,
  };
}

function errorContent() {
  return {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean", const: false },
          code: { type: "string" },
          message: { type: "string" },
          details: {},
        },
        required: ["ok", "code", "message"],
      },
    },
  };
}
