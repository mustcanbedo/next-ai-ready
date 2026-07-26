import type { SemanticGraph } from "@next-ai-ready/core";

/** Render `/sitemap.md`, a compact Markdown directory of canonical page URLs. */
export function renderSitemapMarkdown(graph: SemanticGraph): string {
  const baseUrl = graph.site.baseUrl.replace(/\/$/, "");
  const lines = [
    `# ${graph.site.name} Sitemap`,
    "",
    "> Canonical pages available on this site.",
    "",
    "## Pages",
    "",
  ];

  for (const route of Object.keys(graph.routes).sort()) {
    const pageId = graph.routes[route];
    if (!pageId) continue;
    const page = graph.nodes[pageId];
    if (!page) continue;
    const url = route === "/" ? baseUrl : `${baseUrl}${route}`;
    const title = page.title || route;
    const summary = page.summary ? `: ${page.summary}` : "";
    lines.push(`- [${title}](${url})${summary}`);
  }

  return `${lines.join("\n")}\n`;
}
