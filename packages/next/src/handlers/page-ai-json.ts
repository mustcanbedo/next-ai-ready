import "server-only";
import { renderPageAiJson } from "@next-ai-ready/llms";
import { serializeStable } from "@next-ai-ready/core";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } }) {
  await emitAiRequest(req, "page.ai.json");
  const { path = [] } = await Promise.resolve(ctx.params);
  const route = path.length === 0 ? "/" : "/" + path.join("/");
  const graph = await loadGraph();
  const data = renderPageAiJson(graph, route);
  if (!data) return new Response('{"error":"not found"}', { status: 404, headers: { "content-type": "application/json" } });
  return new Response(serializeStable(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
