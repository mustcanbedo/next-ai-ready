import "server-only";
import { renderPageMarkdown, renderPageMarkdownRecovery } from "@next-ai-ready/llms";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";
import { resolveParams } from "../runtime/params.js";

/**
 * Handler for `/<route>.md`. Expects `params.path` to be the route
 * segments (e.g. `["docs", "install"]`).
 *
 * Wire-up: see `app/%5Fai-ready/md/[...path]/route.ts` written by the
 * `init` codemod, and the rewrite in `withAiReady()`.
 */
// Next 14 passes params directly while Next 15+ passes a Promise. `any` keeps
// the exported route signature acceptable to both framework type generators.
export async function GET(req: Request, ctx: any) {
  const routeContext = ctx as { params: Promise<{ path?: string[] }> | { path?: string[] } };
  await emitAiRequest(req, "page.md");
  const { path = [] } = await resolveParams(routeContext.params);
  const route = path.length === 0 ? "/" : "/" + path.join("/");
  const graph = await loadGraph();
  const body = renderPageMarkdown(graph, route);
  if (!body) {
    const requestedPath = new URL(req.url).pathname;
    const recovery = renderPageMarkdownRecovery(graph, { requestedRoute: route, requestedPath });
    return new Response(recovery, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "no-store",
        "content-location": requestedPath,
        "x-robots-tag": "noindex",
        vary: "Accept, User-Agent",
      },
    });
  }
  const canonical = new URL(route, graph.site.baseUrl).toString();
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      "content-location": `${route}.md`,
      link: `<${canonical}>; rel="canonical"`,
      vary: "Accept, User-Agent",
    },
  });
}
