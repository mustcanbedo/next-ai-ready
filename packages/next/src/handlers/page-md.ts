import "server-only";
import { renderPageMarkdown } from "@next-ai-ready/llms";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

/**
 * Handler for `/<route>.md`. Expects `params.path` to be the route
 * segments (e.g. `["docs", "install"]`).
 *
 * Wire-up: see `app/_ai-ready/md/[...path]/route.ts` written by the
 * `init` codemod, and the rewrite in `withAiReady()`.
 */
export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } }) {
  await emitAiRequest(req, "page.md");
  const { path = [] } = await Promise.resolve(ctx.params);
  const route = path.length === 0 ? "/" : "/" + path.join("/");
  const graph = await loadGraph();
  const body = renderPageMarkdown(graph, route);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
