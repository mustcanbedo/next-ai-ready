import "server-only";
import { renderLlmsTxt } from "@next-ai-ready/llms";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

/**
 * Fallback handler for `/llms.txt`.
 *
 * In production this route normally won't be hit: `next-ai-ready build`
 * writes a static `public/llms.txt`, and Next serves it directly. This
 * handler exists so dev mode (no build) still works.
 */
export async function GET(req: Request) {
  await emitAiRequest(req, "llms.txt");
  const graph = await loadGraph();
  const body = renderLlmsTxt(graph);
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
