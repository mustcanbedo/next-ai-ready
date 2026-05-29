import type { SemanticNode, SiteInfo } from "@next-ai-ready/core";
import { stableId, absoluteUrl } from "@next-ai-ready/core";
import { parseMdx } from "./parse.js";
import { sectionize, type Section } from "./headings.js";
import { deriveSummary } from "./summary.js";
import { extractFaq } from "./faq.js";
import { renderMarkdown, type ComponentMap } from "./to-markdown.js";
import { chunkSections } from "./chunks.js";

export interface CompileInput {
  /** Raw MDX/MD source. */
  source: string;
  /** URL route this file belongs to, e.g. "/docs/install". */
  route: string;
  /** Absolute path on disk (recorded in `source` for traceability). */
  file: string;
  /** Site metadata, used to build `citeUrl`s. */
  site: SiteInfo;
  /** User-supplied `semantic` export, when present. */
  semantic?: {
    summary?: string;
    topics?: string[];
    questions?: { q: string; a: string }[];
    entities?: { name: string; type: string }[];
  };
  /** Optional chunking + JSX-to-Markdown overrides. */
  options?: {
    chunk?: { maxTokens?: number; overlap?: number };
    components?: ComponentMap;
  };
}

export interface CompileOutput {
  /** Root node (kind = "page"). */
  page: SemanticNode;
  /** All section + chunk + faq nodes belonging to this page, flat. */
  children: SemanticNode[];
}

/**
 * Compile one MDX file into a SemanticNode subtree.
 *
 * The output is deterministic — same input + same options → same ids and
 * same bodies. This is enforced by:
 *   • content-based stable ids (`stableId(route, slug, kind)`)
 *   • no timestamps in node payloads
 *   • sorted, heuristic-only extractors
 */
export function compile(input: CompileInput): CompileOutput {
  const { source, route, file, site, semantic } = input;
  const { frontmatter, tree } = parseMdx(source);

  const rootSection = sectionize(tree);
  const summary = deriveSummary({ frontmatter, semantic, tree });
  const questions = extractFaq({ frontmatter, semantic, root: rootSection });
  const body = renderMarkdown(tree, { components: input.options?.components });

  const pageId = stableId(route, "page");
  const citeUrl = absoluteUrl(site.baseUrl, route);
  const updatedAt = pickDate(frontmatter.updatedAt) ?? pickDate(frontmatter.date);
  const author = pickAuthor(frontmatter.author);
  const reviewedBy = pickAuthor(frontmatter.reviewedBy);
  const topics = pickStringArray(semantic?.topics) ?? pickStringArray(frontmatter.tags) ?? deriveTopics(rootSection);
  const entities = mergeEntities(frontmatter.entities, semantic?.entities);
  const title = pickString(frontmatter.title) ?? firstHeadingTitle(rootSection) ?? routeToTitle(route);

  const children: SemanticNode[] = [];

  // 1. FAQ nodes (citable as #faq-<slug>).
  for (const faq of questions) {
    const id = stableId(route, "faq", faq.q);
    children.push({
      id,
      route,
      kind: "faq",
      title: faq.q,
      body: faq.a,
      citeUrl: `${citeUrl}#${slugifyForAnchor(faq.q)}`,
      source: { file },
    });
  }

  // 2. Section nodes — one per non-root heading.
  for (const section of flattenSections(rootSection)) {
    const id = stableId(route, "section", section.slug);
    children.push({
      id,
      route,
      kind: "section",
      title: section.title,
      citeUrl: `${citeUrl}#${section.slug}`,
      source: { file },
    });
  }

  // 3. Chunk nodes — token-aware, with embedding hints.
  const chunks = chunkSections(rootSection, {
    ...(input.options?.chunk ?? {}),
    components: input.options?.components,
  });
  for (const chunk of chunks) {
    const id = stableId(route, "chunk", String(chunk.index));
    children.push({
      id,
      route,
      kind: "chunk",
      title: chunk.breadcrumb || title,
      body: chunk.body,
      citeUrl: chunk.slug ? `${citeUrl}#${chunk.slug}` : citeUrl,
      embeddingHint: chunk.breadcrumb ? `${chunk.breadcrumb}\n\n${chunk.body}` : chunk.body,
      source: { file },
    });
  }

  const page: SemanticNode = {
    id: pageId,
    route,
    kind: "page",
    title,
    summary,
    topics,
    questions: questions.length ? questions : undefined,
    entities: entities.length ? entities : undefined,
    body,
    citeUrl,
    updatedAt,
    author,
    reviewedBy,
    embeddingHint: summary ? `${title}\n\n${summary}` : title,
    children: children.map((c) => c.id),
    source: { file },
  };

  return { page, children };
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function flattenSections(root: Section): Section[] {
  const out: Section[] = [];
  const queue: Section[] = [...root.children];
  while (queue.length) {
    const s = queue.shift()!;
    out.push(s);
    queue.push(...s.children);
  }
  return out;
}

function firstHeadingTitle(root: Section): string | undefined {
  return root.children[0]?.title;
}

function routeToTitle(route: string): string {
  const last = route.split("/").filter(Boolean).at(-1) ?? "Home";
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveTopics(root: Section): string[] | undefined {
  const titles = root.children.slice(0, 4).map((c) => c.title).filter(Boolean);
  return titles.length ? titles : undefined;
}


function slugifyForAnchor(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Accept either an ISO-ish string or a JS Date (gray-matter may auto-parse YAML dates). */
function pickDate(v: unknown): string | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  return pickString(v);
}

function pickStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return out.length ? out : undefined;
}

function pickAuthor(v: unknown): { name: string; url?: string } | undefined {
  if (typeof v === "string" && v.trim()) return { name: v.trim() };
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const name = pickString(obj.name);
    if (name) return { name, url: pickString(obj.url) };
  }
  return undefined;
}

function mergeEntities(
  fm: unknown,
  sem?: { name: string; type: string }[],
): { name: string; type: string }[] {
  const out: { name: string; type: string }[] = [];
  const seen = new Set<string>();
  const push = (e: unknown) => {
    if (!e || typeof e !== "object") return;
    const obj = e as Record<string, unknown>;
    const name = pickString(obj.name);
    const type = pickString(obj.type);
    if (!name || !type) return;
    const key = `${type}:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, type });
  };
  if (Array.isArray(fm)) fm.forEach(push);
  if (Array.isArray(sem)) sem.forEach(push);
  return out;
}
