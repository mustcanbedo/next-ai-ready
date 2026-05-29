import type { SemanticGraph } from "@next-ai-ready/core";
import { toMcpToolDefinitions, type McpToolResult } from "./tools.js";
import { toMcpResourceDefinitions } from "./resources.js";

/**
 * The subset of `@modelcontextprotocol/sdk`'s `McpServer` we depend on.
 *
 * Declared structurally so this package neither hard-depends on a specific
 * SDK version nor needs the SDK installed to build/test. The real binding
 * happens in `@next-ai-ready/next` (HTTP, via `mcp-handler`) or in the CLI
 * (stdio), both of which pass a concrete `McpServer` instance.
 */
export interface McpServerLike {
  tool(
    name: string,
    description: string,
    paramsSchema: Record<string, unknown>,
    handler: (args: unknown) => Promise<McpToolResult>,
  ): void;
  resource?: (
    name: string,
    uri: string,
    handler: () => { contents: Array<{ uri: string; mimeType: string; text: string }> },
  ) => void;
}

export interface RegisterOptions {
  /** Also register graph pages as MCP resources. Requires `graph`. */
  graph?: SemanticGraph;
  /** Filter which tools get registered (by action name). Default: all public. */
  includeTool?: (name: string) => boolean;
}

/**
 * Register all public actions (and optionally graph pages) onto an MCP server.
 *
 * Returns the count of registered tools/resources so callers can log or test.
 * The action registry must already be populated (the user's `actions/index.ts`
 * imported) before calling this.
 */
export function registerAiReady(server: McpServerLike, opts: RegisterOptions = {}): { tools: number; resources: number } {
  let tools = 0;
  for (const def of toMcpToolDefinitions()) {
    if (opts.includeTool && !opts.includeTool(def.name)) continue;
    server.tool(def.name, def.description, def.inputShape, (args) => def.execute(args));
    tools += 1;
  }

  let resources = 0;
  if (opts.graph && typeof server.resource === "function") {
    for (const res of toMcpResourceDefinitions(opts.graph)) {
      server.resource(res.name, res.uri, () => ({ contents: [res.read()] }));
      resources += 1;
    }
  }

  return { tools, resources };
}
