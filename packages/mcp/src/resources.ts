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

export const MCP_PAGE_URI_PREFIX = "airead://page";

const MAX_ROUTE_LENGTH = 512;

/**
 * Validate an MCP page route without changing the graph key the caller supplied.
 * Encoded path separators and traversal segments are rejected before lookup.
 */
export function safeMcpPageRoute(route: string): string | null {
  if (route.length === 0 || route.length > MAX_ROUTE_LENGTH || route === "/") return route === "/" ? route : null;
  if (!route.startsWith("/") || route.startsWith("//") || route.endsWith("/")) return null;
  if (/[\\?#]/u.test(route) || hasControlCharacter(route) || route.includes("//")) return null;

  for (const segment of route.slice(1).split("/")) {
    if (!segment) return null;
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (decoded === "." || decoded === ".." || /[\\/?#]/u.test(decoded) || hasControlCharacter(decoded)) return null;
    try {
      encodeURIComponent(decoded);
    } catch {
      return null;
    }
  }

  return route;
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/** Build MCP resource URI for a site route (C-72). */
export function mcpPageUri(route: string): string {
  const safeRoute = safeMcpPageRoute(route);
  if (safeRoute === null) throw new TypeError(`Invalid MCP page route: ${JSON.stringify(route)}`);
  if (safeRoute === "/") return `${MCP_PAGE_URI_PREFIX}/index`;
  const encoded = safeRoute
    .slice(1)
    .split("/")
    .map((segment, index) => (index === 0 && safeRoute === "/index" ? "%69ndex" : encodeURIComponent(segment)))
    .join("/");
  return `${MCP_PAGE_URI_PREFIX}/${encoded}`;
}

/** Parse MCP page URI back to a site route, or `null` if not a page resource. */
export function routeFromMcpPageUri(uri: string): string | null {
  if (uri.length > MCP_PAGE_URI_PREFIX.length + MAX_ROUTE_LENGTH * 12 || !uri.startsWith(`${MCP_PAGE_URI_PREFIX}/`)) return null;
  const rawRoute = uri.slice(MCP_PAGE_URI_PREFIX.length);
  if (rawRoute === "/index") return "/";
  let route: string;
  try {
    route = `/${rawRoute
      .slice(1)
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/")}`;
  } catch {
    return null;
  }
  return safeMcpPageRoute(route);
}

/**
 * Expose every page in the graph as an MCP resource. Clients (Claude
 * Desktop, etc.) can list these and pull the full Markdown of any page —
 * the same artifact served at `/<route>.md`, so there's one source of truth.
 */
export function toMcpResourceDefinitions(graph: SemanticGraph): McpResourceDefinition[] {
  return Object.keys(graph.routes)
    .filter((route) => safeMcpPageRoute(route) !== null)
    .sort()
    .map((route) => {
      const rootId = graph.routes[route];
      const node = rootId ? graph.nodes[rootId] : undefined;
      const uri = mcpPageUri(route);
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
  const route = routeFromMcpPageUri(uri);
  if (route === null) return null;
  const text = renderPageMarkdown(graph, route);
  if (text === null) return null;
  return { uri, mimeType: "text/markdown", text };
}
