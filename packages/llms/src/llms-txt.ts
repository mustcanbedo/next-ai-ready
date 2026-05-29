import type { AiReadyConfig, SemanticGraph, SemanticNode } from "@next-ai-ready/core";

export interface LlmsTxtOptions {
  /** Curation config (sections / exclude). Defaults to "everything in one section". */
  llms?: AiReadyConfig["llms"];
}

/**
 * Render a `/llms.txt` file per AnswerDotAI's spec (https://llmstxt.org).
 *
 * Format:
 *   # <site name>
 *   > <site description>
 *
 *   ## <section title>
 *   - [<page title>](<absolute url>): <summary>
 *   ...
 *
 * Curation: when `llms.sections` is provided, only routes matching `include`
 * globs are listed; `priority: "high"` sections come first; `limit` caps
 * entries per section (most recent first by `updatedAt`).
 *
 * When no sections are configured, all non-excluded pages land under
 * "Pages" in route order — useful as a zero-config default.
 */
export function renderLlmsTxt(graph: SemanticGraph, opts: LlmsTxtOptions = {}): string {
  const site = graph.site;
  const sections = opts.llms?.sections;
  const exclude = opts.llms?.exclude ?? [];

  const allPages = Object.values(graph.routes)
    .map((id) => graph.nodes[id])
    .filter((n): n is SemanticNode => !!n && !matchAny(n.route, exclude));

  const lines: string[] = [];
  lines.push(`# ${site.name}`);
  if (site.description) lines.push("");
  if (site.description) lines.push(`> ${site.description}`);
  if (graph.generatedAt) {
    lines.push("");
    lines.push(`<!-- Last updated: ${graph.generatedAt.slice(0, 10)} -->`);
  }
  lines.push("");

  if (sections && sections.length > 0) {
    // Sort sections: high priority first, then by declared order.
    const ordered = [...sections].sort((a, b) => {
      const ap = a.priority === "high" ? 0 : 1;
      const bp = b.priority === "high" ? 0 : 1;
      return ap - bp;
    });
    const used = new Set<string>();
    for (const section of ordered) {
      const pages = allPages
        .filter((p) => matchOne(p.route, section.include))
        .filter((p) => !used.has(p.route))
        .sort(byMostRecent);
      const capped = section.limit ? pages.slice(0, section.limit) : pages;
      if (capped.length === 0) continue;
      lines.push(`## ${section.title}`);
      lines.push("");
      for (const p of capped) {
        lines.push(formatEntry(p));
        used.add(p.route);
      }
      lines.push("");
    }
  } else {
    lines.push("## Pages");
    lines.push("");
    for (const p of [...allPages].sort((a, b) => a.route.localeCompare(b.route))) {
      lines.push(formatEntry(p));
    }
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function formatEntry(p: SemanticNode): string {
  const title = p.title ?? p.route;
  const url = p.citeUrl ?? p.route;
  const summary = p.summary ? `: ${p.summary}` : "";
  return `- [${title}](${url})${summary}`;
}

function byMostRecent(a: SemanticNode, b: SemanticNode): number {
  const da = a.updatedAt ?? "";
  const db = b.updatedAt ?? "";
  if (da === db) return a.route.localeCompare(b.route);
  return db.localeCompare(da);
}

function matchOne(route: string, pattern: string): boolean {
  return globToRegex(pattern).test(route);
}

function matchAny(route: string, patterns: string[]): boolean {
  return patterns.some((p) => matchOne(route, p));
}

/**
 * Very small glob → regex. Supports `*` (one segment) and `**` (any depth).
 * Adequate for route patterns like `/docs/**` or `/blog/*`.
 */
function globToRegex(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if (/[.+?^${}()|[\]\\]/.test(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  re += "$";
  return new RegExp(re);
}
