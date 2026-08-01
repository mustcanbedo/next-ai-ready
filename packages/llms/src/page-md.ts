import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";

export interface PageMarkdownRecoveryOptions {
  /** Route resolved by the page Markdown handler, without the `.md` suffix. */
  requestedRoute: string;
  /** Original request pathname, preserving the representation the agent requested. */
  requestedPath?: string;
  /** Maximum suggestions to render. Capped at five. */
  limit?: number;
}

interface PageMarkdownSuggestion {
  route: string;
  title: string;
  url: string;
  summary?: string;
}

const MAX_SUGGESTIONS = 5;
const MAX_SIMILARITY_CODE_POINTS = 256;
const MAX_METADATA_CODE_POINTS = 2_048;
const MAX_SUGGESTION_TEXT_CODE_POINTS = 320;
const MAX_URL_CODE_POINTS = 2_048;

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

/**
 * Render a machine-readable recovery document for an unavailable Markdown page.
 * The result is intentionally a successful Markdown representation so an agent can
 * recover through suggested pages or the site-wide discovery artifacts.
 */
export function renderPageMarkdownRecovery(
  graph: SemanticGraph,
  options: PageMarkdownRecoveryOptions,
): string {
  const requestedRoute = normalizeRoute(options.requestedRoute);
  const metadataRoute = truncateCodePoints(requestedRoute, MAX_METADATA_CODE_POINTS);
  const defaultRequestedPath = metadataRoute === "/" ? "/.md" : `${metadataRoute}.md`;
  const requestedPath = truncateCodePoints(
    options.requestedPath ?? defaultRequestedPath,
    MAX_METADATA_CODE_POINTS,
  );
  const limit = normalizeSuggestionLimit(options.limit);
  const suggestions = findPageMarkdownSuggestions(graph, requestedRoute, limit);
  const llmsUrl = siteHttpUrl("/llms.txt", graph.site.baseUrl);
  const sitemapUrl = siteHttpUrl("/sitemap.md", graph.site.baseUrl);

  const lines = [
    "---",
    `title: ${yamlString("Page not found")}`,
    `document_status: ${yamlString("not_found")}`,
    "recovery: true",
    `requested_path: ${yamlString(requestedPath)}`,
    `requested_route: ${yamlString(metadataRoute)}`,
    `suggestion_count: ${suggestions.length}`,
    `llms_txt: ${yamlString(llmsUrl)}`,
    `sitemap_md: ${yamlString(sitemapUrl)}`,
    "---",
    "",
    "# Page not found",
    "",
    "The requested Markdown page is not available.",
    "",
  ];

  if (suggestions.length > 0) {
    lines.push("## Suggested pages", "");
    for (const suggestion of suggestions) {
      const description = suggestion.summary ? `: ${suggestion.summary}` : "";
      lines.push(`- [${suggestion.title}](${suggestion.url})${description}`);
    }
    lines.push("");
  }

  lines.push(
    "## Site discovery",
    "",
    `- [LLM content index](${llmsUrl})`,
    `- [Markdown sitemap](${sitemapUrl})`,
    "",
  );

  return lines.join("\n");
}

/** Return up to five route-level pages ordered by deterministic relevance. */
function findPageMarkdownSuggestions(
  graph: SemanticGraph,
  requestedRoute: string,
  limit = 5,
): PageMarkdownSuggestion[] {
  const normalizedRequest = normalizeRoute(requestedRoute);
  const cappedLimit = normalizeSuggestionLimit(limit);
  if (cappedLimit === 0) return [];
  const ranked: Array<PageMarkdownSuggestion & { score: number }> = [];

  for (const [route, id] of Object.entries(graph.routes)) {
    const page = graph.nodes[id];
    if (!page) continue;
    const normalizedRoute = normalizeRoute(route);
    const url = parseHttpUrl(page.citeUrl, graph.site.baseUrl) ?? parseHttpUrl(normalizedRoute, graph.site.baseUrl);
    if (!url) continue;
    const title = sanitizeMarkdownInline(page.title ?? normalizedRoute);
    const candidate = {
      route: normalizedRoute,
      title: title || "Untitled page",
      url,
      summary: page.summary ? sanitizeMarkdownInline(page.summary) || undefined : undefined,
      score: similarityScore(normalizedRequest, normalizedRoute),
    };

    const insertionIndex = ranked.findIndex((existing) => compareRank(candidate, existing) < 0);
    if (insertionIndex === -1) {
      if (ranked.length < cappedLimit) ranked.push(candidate);
    } else {
      ranked.splice(insertionIndex, 0, candidate);
      if (ranked.length > cappedLimit) ranked.pop();
    }
  }

  return ranked.map(({ score: _score, ...page }) => page);
}

function formatPage(page: SemanticNode): string {
  const meta: string[] = ["---"];
  meta.push(`title: ${page.title ?? page.route}`);
  if (page.summary) meta.push(`description: ${page.summary}`);
  if (page.citeUrl) {
    meta.push(`canonical_url: ${page.citeUrl}`);
    meta.push(`url: ${page.citeUrl}`);
  }
  if (page.updatedAt) {
    meta.push(`last_updated: ${page.updatedAt}`);
    meta.push(`updated: ${page.updatedAt}`);
  }
  if (page.author?.name) meta.push(`author: ${page.author.name}`);
  if (page.summary) meta.push(`summary: ${page.summary}`);
  if (page.topics?.length) meta.push(`topics: [${page.topics.join(", ")}]`);
  meta.push("---");
  meta.push("");
  if (page.body) meta.push(page.body);
  return meta.join("\n") + "\n";
}

function similarityScore(requestedRoute: string, candidateRoute: string): number {
  const normalizedRequest = normalizeForSimilarity(requestedRoute);
  const normalizedCandidate = normalizeForSimilarity(candidateRoute);
  const requestedSegments = tokenize(normalizedRequest);
  const candidateSegments = tokenize(normalizedCandidate);

  let prefixSegments = 0;
  while (
    prefixSegments < requestedSegments.length &&
    prefixSegments < candidateSegments.length &&
    requestedSegments[prefixSegments] === candidateSegments[prefixSegments]
  ) {
    prefixSegments += 1;
  }

  let sharedSegments = 0;
  const remainingSegments = new Set(candidateSegments);
  for (const segment of requestedSegments) {
    if (remainingSegments.delete(segment)) sharedSegments += 1;
  }

  const exactMatch = normalizedRequest === normalizedCandidate ? 1_000 : 0;
  return exactMatch + prefixSegments * 100 + sharedSegments * 25 + bigramSimilarity(normalizedRequest, normalizedCandidate);
}

function normalizeRoute(route: string): string {
  const withLeadingSlash = route.startsWith("/") ? route : `/${route}`;
  const withoutMarkdown = withLeadingSlash.endsWith(".md") ? withLeadingSlash.slice(0, -3) : withLeadingSlash;
  if (withoutMarkdown === "") return "/";
  return withoutMarkdown.length > 1 ? withoutMarkdown.replace(/\/+$/, "") : withoutMarkdown;
}

function normalizeForSimilarity(value: string): string {
  const bounded = truncateCodePoints(value, MAX_SIMILARITY_CODE_POINTS);
  return truncateCodePoints(
    bounded.normalize("NFKC").toLocaleLowerCase("en"),
    MAX_SIMILARITY_CODE_POINTS,
  );
}

function tokenize(value: string): string[] {
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function bigramSimilarity(a: string, b: string): number {
  if (a === b) return 50;
  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  if (aBigrams.size === 0 || bBigrams.size === 0) return 0;

  let shared = 0;
  const [smaller, larger] = aBigrams.size <= bBigrams.size ? [aBigrams, bBigrams] : [bBigrams, aBigrams];
  for (const bigram of smaller) {
    if (larger.has(bigram)) shared += 1;
  }
  return Math.round((100 * shared) / (aBigrams.size + bBigrams.size));
}

function bigrams(value: string): Set<string> {
  const characters = Array.from(value);
  const result = new Set<string>();
  for (let index = 1; index < characters.length; index += 1) {
    result.add(`${characters[index - 1]}${characters[index]}`);
  }
  return result;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function compareRoutes(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareRank(
  a: PageMarkdownSuggestion & { score: number },
  b: PageMarkdownSuggestion & { score: number },
): number {
  return b.score - a.score || compareRoutes(a.route, b.route);
}

function normalizeSuggestionLimit(limit: number | undefined): number {
  if (limit === undefined) return MAX_SUGGESTIONS;
  if (!Number.isFinite(limit)) return limit === Number.POSITIVE_INFINITY ? MAX_SUGGESTIONS : 0;
  return Math.min(MAX_SUGGESTIONS, Math.max(0, Math.trunc(limit)));
}

function truncateCodePoints(value: string, limit: number): string {
  return Array.from(value.slice(0, limit * 2)).slice(0, limit).join("");
}

function sanitizeMarkdownInline(value: string): string {
  const bounded = truncateCodePoints(value, MAX_SUGGESTION_TEXT_CODE_POINTS);
  const plain = truncateCodePoints(bounded.normalize("NFKC"), MAX_SUGGESTION_TEXT_CODE_POINTS)
    .replace(/\p{C}+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return plain.replace(/[\\`*_[\]{}()#+.!|<>-]/g, "\\$&");
}

function parseHttpUrl(value: string | undefined, baseUrl: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const serialized = url.toString().replace(/[()<>\s]/g, (character) => encodeURIComponent(character));
    return hasAtMostCodePoints(serialized, MAX_URL_CODE_POINTS) ? serialized : null;
  } catch {
    return null;
  }
}

function hasAtMostCodePoints(value: string, limit: number): boolean {
  let count = 0;
  const characters = value[Symbol.iterator]();
  while (!characters.next().done) {
    count += 1;
    if (count > limit) return false;
  }
  return true;
}

function siteHttpUrl(path: string, baseUrl: string): string {
  const url = parseHttpUrl(path, baseUrl);
  if (!url) throw new TypeError("site.baseUrl must be an http or https URL");
  return url;
}
