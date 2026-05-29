import type { SemanticGraph, SemanticNode, SiteInfo } from "@next-ai-ready/core";

export interface BuildGraphInput {
  site: SiteInfo;
  pages: { page: SemanticNode; children: SemanticNode[] }[];
  generatedAt?: string;
}

/**
 * Assemble per-file compile outputs into a single, deterministic SemanticGraph.
 *
 * Notes:
 *   • Routes are sorted lexicographically so the resulting JSON diffs cleanly.
 *   • Nodes are stored flat keyed by id; tree structure is reconstructed via
 *     `SemanticNode.children` (an array of ids).
 *   • `generatedAt` is the *only* non-deterministic field and is intentionally
 *     scoped to the graph header (not the nodes) so node diffs stay stable.
 */
export function buildGraph(input: BuildGraphInput): SemanticGraph {
  const nodes: Record<string, SemanticNode> = {};
  const routes: Record<string, string> = {};

  const sorted = [...input.pages].sort((a, b) => a.page.route.localeCompare(b.page.route));
  for (const { page, children } of sorted) {
    nodes[page.id] = page;
    routes[page.route] = page.id;
    for (const child of children) nodes[child.id] = child;
  }

  return {
    nodes,
    routes,
    site: input.site,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  };
}

/** Collect the page node + all its descendant nodes for a given route. */
export function getPageNodes(graph: SemanticGraph, route: string): SemanticNode[] {
  const rootId = graph.routes[route];
  if (!rootId) return [];
  const root = graph.nodes[rootId];
  if (!root) return [];
  const out: SemanticNode[] = [root];
  for (const childId of root.children ?? []) {
    const child = graph.nodes[childId];
    if (child) out.push(child);
  }
  return out;
}
