import "server-only";
import { renderPageAiJson } from "@next-ai-ready/llms";
import { serializeStable } from "@next-ai-ready/core/json";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";
import { resolveParams } from "../runtime/params.js";

// Next 14 passes params directly while Next 15+ passes a Promise. `any` keeps
// the exported route signature acceptable to both framework type generators.
export async function GET(req: Request, ctx: any) {
  const routeContext = ctx as { params: Promise<{ path?: string[] }> | { path?: string[] } };
  await emitAiRequest(req, "page.ai.json");
  const { path = [] } = await resolveParams(routeContext.params);
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
