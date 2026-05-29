import "server-only";
import { buildOpenApi } from "@next-ai-ready/openapi";
import { serializeStable } from "@next-ai-ready/core";
import { loadActionsManifest } from "../runtime/manifest-loader.js";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

/**
 * Serve `/api/openapi.json`. In production the build CLI writes a static
 * `public/openapi.json` and Next serves it directly; this handler is the
 * dev-mode (and fallback) path.
 */
export async function GET(req: Request) {
  await emitAiRequest(req, "openapi.json");
  const [manifest, graph] = await Promise.all([loadActionsManifest(), loadGraph()]);
  if (!manifest) {
    return new Response('{"error":"no actions registered"}', {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(serializeStable(buildOpenApi(manifest, graph.site)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
