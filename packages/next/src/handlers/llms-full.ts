import "server-only";
import { renderLlmsFullTxt } from "@next-ai-ready/llms";
import { loadGraph } from "../runtime/graph-loader.js";
import { emitAiRequest } from "../runtime/observability.js";

export async function GET(req: Request) {
  await emitAiRequest(req, "llms-full.txt");
  const graph = await loadGraph();
  return new Response(renderLlmsFullTxt(graph), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
