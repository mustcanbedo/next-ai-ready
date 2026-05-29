import "server-only";
import { registerAiReady, type McpServerLike } from "@next-ai-ready/mcp";
import { loadGraph } from "../runtime/graph-loader.js";

export interface AiReadyMcpOptions {
  /**
   * Expose graph pages as MCP resources in addition to action tools.
   * Default: `true`. Set `false` for an actions-only server.
   */
  resources?: boolean;
  /** Base path the handler is mounted at. Passed through to `mcp-handler`. */
  basePath?: string;
}

/**
 * Create a Next.js route handler that speaks MCP over Streamable HTTP, with
 * every public action registered as a tool and (optionally) every page as a
 * resource.
 *
 * Thin adapter per ADR-008: the wire protocol, session handling and SSE all
 * live in `mcp-handler` — we only map our registry onto the server. The route
 * stub at `app/api/mcp/[transport]/route.ts` does:
 *
 *   import "@/actions";
 *   import { createAiReadyMcpHandler } from "@next-ai-ready/next/handlers/mcp";
 *   const handler = await createAiReadyMcpHandler();
 *   export { handler as GET, handler as POST };
 *
 * `mcp-handler` is a peer dependency (not bundled). We import it dynamically
 * so this module loads even in environments that don't have it installed,
 * failing only with a clear, actionable message when actually invoked.
 */
export async function createAiReadyMcpHandler(opts: AiReadyMcpOptions = {}) {
  const { createMcpHandler } = await importMcpHandler();
  const graph = opts.resources === false ? undefined : await loadGraph().catch(() => undefined);

  return createMcpHandler(
    (server: McpServerLike) => {
      registerAiReady(server, { graph });
    },
    undefined,
    opts.basePath ? { basePath: opts.basePath } : undefined,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importMcpHandler(): Promise<{ createMcpHandler: (...args: any[]) => any }> {
  try {
    // Indirect specifier: keeps TS/bundlers from statically resolving a
    // package that consumers may legitimately not have installed (it's an
    // optional peer dep). Resolved at runtime only when the route is hit.
    const spec = "mcp-handler";
    return (await import(/* @vite-ignore */ spec)) as never;
  } catch {
    throw new Error(
      "[next-ai-ready] The MCP HTTP handler requires the `mcp-handler` package. " +
        "Install it: `npm i mcp-handler @modelcontextprotocol/sdk`.",
    );
  }
}
