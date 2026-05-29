import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";

/**
 * Render the AI-ingestion form of one page: a Markdown document prefixed
 * with a small metadata header (YAML-like, but human-readable) so an LLM
 * reading the raw file has everything it needs to cite it.
 *
 * Served at `/<route>.md` for any page in the graph.
 *
 * Returns `null` if the route isn't in the graph (caller decides 404).
 */
export function renderPageMarkdown(graph: SemanticGraph, route: string): string | null {
  const id = graph.routes[route];
  if (!id) return null;
  const page = graph.nodes[id];
  if (!page) return null;
  return formatPage(page);
}

function formatPage(page: SemanticNode): string {
  const meta: string[] = ["---"];
  meta.push(`title: ${page.title ?? page.route}`);
  if (page.citeUrl) meta.push(`url: ${page.citeUrl}`);
  if (page.updatedAt) meta.push(`updated: ${page.updatedAt}`);
  if (page.author?.name) meta.push(`author: ${page.author.name}`);
  if (page.summary) meta.push(`summary: ${page.summary}`);
  if (page.topics?.length) meta.push(`topics: [${page.topics.join(", ")}]`);
  meta.push("---");
  meta.push("");
  if (page.body) meta.push(page.body);
  return meta.join("\n") + "\n";
}
