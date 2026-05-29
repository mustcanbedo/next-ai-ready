import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";

/**
 * Render `/llms-full.txt` — a single Markdown dump of every page body,
 * with stable separators so a model can locate sources later.
 *
 * Each page is rendered as:
 *
 *   <!-- BEGIN <route> -->
 *   # <title>
 *   URL: <citeUrl>
 *   Updated: <updatedAt?>
 *
 *   <body>
 *   <!-- END <route> -->
 *
 * Pages are emitted in lexicographic route order for stable diffs.
 */
export function renderLlmsFullTxt(graph: SemanticGraph): string {
  const pages = Object.values(graph.routes)
    .map((id) => graph.nodes[id])
    .filter((n): n is SemanticNode => !!n)
    .sort((a, b) => a.route.localeCompare(b.route));

  const out: string[] = [];
  out.push(`# ${graph.site.name} — full content`);
  if (graph.site.description) out.push(`\n> ${graph.site.description}`);
  out.push("");

  for (const page of pages) {
    out.push(`<!-- BEGIN ${page.route} -->`);
    out.push(`# ${page.title ?? page.route}`);
    if (page.citeUrl) out.push(`URL: ${page.citeUrl}`);
    if (page.updatedAt) out.push(`Updated: ${page.updatedAt}`);
    out.push("");
    if (page.body) out.push(page.body);
    out.push("");
    out.push(`<!-- END ${page.route} -->`);
    out.push("");
  }

  return out.join("\n").trim() + "\n";
}
