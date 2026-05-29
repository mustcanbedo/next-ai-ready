import type { SemanticGraph } from "@next-ai-ready/core";
import { renderPageMarkdown } from "@next-ai-ready/llms";

/** A readable MCP resource derived from a page in the semantic graph. */
export interface McpResourceDefinition {
  /** Stable resource URI, e.g. `airead://page/docs/install`. */
  uri: string;
  name: string;
  description?: string;
  mimeType: string;
  /** Lazily render the resource body (Markdown with metadata header). */
  read(): { uri: string; mimeType: string; text: string };
}

const URI_PREFIX = "airead://page";

/**
 * Expose every page in the graph as an MCP resource. Clients (Claude
 * Desktop, etc.) can list these and pull the full Markdown of any page —
 * the same artifact served at `/<route>.md`, so there's one source of truth.
 */
export function toMcpResourceDefinitions(graph: SemanticGraph): McpResourceDefinition[] {
  return Object.keys(graph.routes)
    .sort()
    .map((route) => {
      const rootId = graph.routes[route];
      const node = rootId ? graph.nodes[rootId] : undefined;
      const uri = `${URI_PREFIX}${route === "/" ? "/index" : route}`;
      return {
        uri,
        name: node?.title ?? route,
        description: node?.summary,
        mimeType: "text/markdown",
        read() {
          const text = renderPageMarkdown(graph, route) ?? "";
          return { uri, mimeType: "text/markdown", text };
        },
      };
    });
}

/** Resolve a previously-listed resource URI back to its rendered body. */
export function readMcpResource(graph: SemanticGraph, uri: string): { uri: string; mimeType: string; text: string } | null {
  if (!uri.startsWith(URI_PREFIX)) return null;
  let route = uri.slice(URI_PREFIX.length);
  if (route === "/index") route = "/";
  const text = renderPageMarkdown(graph, route);
  if (text === null) return null;
  return { uri, mimeType: "text/markdown", text };
}
