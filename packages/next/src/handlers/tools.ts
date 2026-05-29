import "server-only";
import { buildToolsJson } from "@next-ai-ready/openapi";
import { serializeStable } from "@next-ai-ready/core";
import { loadActionsManifest } from "../runtime/manifest-loader.js";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

export async function GET(req: Request) {
  await emitAiRequest(req, "tools.json");
  const [manifest, graph] = await Promise.all([loadActionsManifest(), loadGraph()]);
  if (!manifest) {
    return new Response('{"tools":[]}', {
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(serializeStable(buildToolsJson(manifest, graph.site)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
