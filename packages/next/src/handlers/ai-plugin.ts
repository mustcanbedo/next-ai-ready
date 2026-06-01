import "server-only";
import { buildAiPlugin } from "@next-ai-ready/openapi";
import { serializeStable } from "@next-ai-ready/core";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

/**
 * Serve `/.well-known/ai-plugin.json` in dev / fallback mode (T-07).
 * Production builds also write a static copy to `public/.well-known/`.
 */
export async function GET(req: Request) {
  await emitAiRequest(req, "ai-plugin.json");
  const graph = await loadGraph();
  return new Response(serializeStable(buildAiPlugin(graph.site)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
