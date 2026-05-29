import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";

export interface PageAiJson {
  route: string;
  page: SemanticNode;
  /** Section + faq + chunk nodes for this page, flat. */
  children: SemanticNode[];
}

/**
 * Render `/<route>.ai.json` — a structured, retrieval-ready snapshot of
 * one page. Includes the page node plus all its descendants (sections, FAQ,
 * chunks with embedding hints).
 *
 * This is the canonical RAG-ready format: drop straight into a vector index.
 */
export function renderPageAiJson(graph: SemanticGraph, route: string): PageAiJson | null {
  const id = graph.routes[route];
  if (!id) return null;
  const page = graph.nodes[id];
  if (!page) return null;
  const children: SemanticNode[] = [];
  for (const childId of page.children ?? []) {
    const child = graph.nodes[childId];
    if (child) children.push(child);
  }
  return { route, page, children };
}
