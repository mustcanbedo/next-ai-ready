import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";

const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 20;
const MAX_QUERY_LENGTH = 200;
const MAX_SEARCH_TEXT_LENGTH = 8_000;
const MAX_EXCERPT_LENGTH = 280;
const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 500;

export interface PageSearchInput {
  query: string;
  locale?: string;
  limit?: number;
}

export interface PageSearchResult {
  route: string;
  title: string;
  summary?: string;
  url?: string;
  locale?: string;
  updatedAt?: string;
  score: number;
  excerpt?: string;
}

export interface PageSearchResponse {
  query: string;
  results: PageSearchResult[];
  totalMatches: number;
}

/** Replace this interface to use a runtime index without changing HTTP or MCP adapters. */
export interface PageSearchProvider {
  search(input: PageSearchInput): PageSearchResponse | Promise<PageSearchResponse>;
}

/** Return whether a query contains searchable letters or numbers within the public input bound. */
export function isSearchablePageQuery(query: string): boolean {
  if (Array.from(query).length > MAX_QUERY_LENGTH) return false;
  return tokenize(normalizeSearchText(query)).length > 0;
}

/** Create the default deterministic, database-free search provider for a SemanticGraph. */
export function createGraphSearchProvider(graph: SemanticGraph): PageSearchProvider {
  return { search: (input) => searchGraphPages(graph, input) };
}

/** Search a SemanticGraph with the same ranking used by the HTTP and MCP adapters. */
export function searchGraphPages(graph: SemanticGraph, input: PageSearchInput): PageSearchResponse {
  const query = normalizeSearchText(input.query);
  const rawTerms = [...new Set(tokenize(query))];
  if (!query || rawTerms.length === 0 || Array.from(input.query).length > MAX_QUERY_LENGTH) {
    return { query: input.query, results: [], totalMatches: 0 };
  }

  const siteTerms = new Set(tokenize(normalizeSearchText(graph.site.name)));
  const discriminatingTerms = rawTerms.filter((term) => !siteTerms.has(term));
  const terms = discriminatingTerms.length > 0 ? discriminatingTerms : rawTerms;
  const locale = input.locale === undefined ? undefined : normalizeSearchText(input.locale);
  const limit = normalizeLimit(input.limit);
  const ranked: RankedPage[] = [];
  let totalMatches = 0;
  const pages = graphPages(graph).filter(
    (page) => locale === undefined || normalizeSearchText(page.node.locale ?? "") === locale,
  );
  const termWeights = inverseDocumentFrequency(pages, terms);

  for (const { route, node } of pages) {
    const candidate = rankPage(route, node, query, terms, termWeights);
    if (candidate.score <= 0) continue;
    totalMatches += 1;
    insertRanked(ranked, candidate, limit);
  }

  return {
    query: input.query,
    results: ranked.map(({ route, node, score, excerpt }) => compact({
      route,
      title: boundedText(node.title ?? route, MAX_TITLE_LENGTH),
      summary: node.summary === undefined ? undefined : boundedText(node.summary, MAX_SUMMARY_LENGTH),
      url: safePageUrl(graph.site.baseUrl, route),
      locale: node.locale === undefined ? undefined : boundedText(node.locale, 64),
      updatedAt: node.updatedAt === undefined ? undefined : boundedText(node.updatedAt, 64),
      score,
      excerpt,
    })),
    totalMatches,
  };
}

interface GraphPage {
  route: string;
  node: SemanticNode;
}

interface RankedPage extends GraphPage {
  score: number;
  excerpt?: string;
}

function graphPages(graph: SemanticGraph): GraphPage[] {
  return Object.keys(graph.routes)
    .sort(compareText)
    .flatMap((route) => {
      const id = graph.routes[route];
      const node = id === undefined ? undefined : graph.nodes[id];
      return node === undefined ? [] : [{ route, node }];
    });
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_SEARCH_LIMIT;
  return Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.trunc(limit)));
}

function searchableFields(route: string, node: SemanticNode): Array<{ value: string | undefined; weight: number }> {
  return [
    { value: route, weight: 12 },
    { value: node.title, weight: 10 },
    { value: node.summary, weight: 7 },
    { value: boundedJoin(node.topics), weight: 6 },
    { value: boundedJoin(node.questions, (item) => `${item.q} ${item.a}`), weight: 5 },
    { value: boundedJoin(node.entities, (item) => `${item.name} ${item.type}`), weight: 4 },
    { value: node.embeddingHint, weight: 3 },
    { value: node.body, weight: 1 },
  ];
}

function inverseDocumentFrequency(pages: GraphPage[], terms: string[]): Map<string, number> {
  const frequencies = new Map(terms.map((term) => [term, 0]));
  for (const { route, node } of pages) {
    const pageTerms = new Set(
      searchableFields(route, node).flatMap((field) => field.value ? tokenize(normalizeSearchText(field.value)) : []),
    );
    for (const term of terms) {
      if (hasLexicalMatch(pageTerms, term)) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    }
  }
  return new Map(
    terms.map((term) => [term, 1 + Math.log((pages.length + 1) / ((frequencies.get(term) ?? 0) + 1))]),
  );
}

function rankPage(
  route: string,
  node: SemanticNode,
  query: string,
  terms: string[],
  termWeights: Map<string, number>,
): RankedPage {
  let score = 0;
  let excerptSource: string | undefined;
  for (const field of searchableFields(route, node)) {
    if (!field.value) continue;
    const normalized = normalizeSearchText(field.value);
    if (!normalized) continue;
    if (normalized.includes(query)) {
      score += field.weight * 10;
      excerptSource ??= field.value;
    }
    const fieldTerms = new Set(tokenize(normalized));
    let matched = 0;
    for (const term of terms) {
      if (hasLexicalMatch(fieldTerms, term)) matched += termWeights.get(term) ?? 1;
    }
    if (matched > 0) {
      score += field.weight * matched;
      excerptSource ??= field.value;
    }
  }
  return {
    route,
    node,
    score,
    excerpt: excerptSource === undefined ? undefined : excerpt(excerptSource, query),
  };
}

function insertRanked(ranked: RankedPage[], candidate: RankedPage, limit: number): void {
  const index = ranked.findIndex((existing) => compareRank(candidate, existing) < 0);
  if (index === -1) {
    if (ranked.length < limit) ranked.push(candidate);
  } else {
    ranked.splice(index, 0, candidate);
    if (ranked.length > limit) ranked.pop();
  }
}

function compareRank(a: RankedPage, b: RankedPage): number {
  return b.score - a.score || compareText(a.route, b.route);
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function normalizeSearchText(value: string): string {
  return boundedText(boundedText(value, MAX_SEARCH_TEXT_LENGTH).normalize("NFKC"), MAX_SEARCH_TEXT_LENGTH)
    .toLocaleLowerCase("en")
    .trim();
}

function tokenize(value: string): string[] {
  const chunks = value.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+|[a-z0-9]+|[\p{L}\p{N}]+/gu,
  ) ?? [];
  const terms: string[] = [];
  for (const chunk of chunks) {
    if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(chunk)) {
      terms.push(chunk);
      continue;
    }
    const codePoints = Array.from(chunk);
    if (codePoints.length === 1) terms.push(chunk);
    for (let index = 0; index < codePoints.length - 1; index += 1) {
      terms.push(`${codePoints[index]}${codePoints[index + 1]}`);
    }
  }
  return terms;
}

function hasLexicalMatch(fieldTerms: Set<string>, queryTerm: string): boolean {
  if (fieldTerms.has(queryTerm)) return true;
  if (queryTerm.length < 5 || !/^[a-z0-9]+$/u.test(queryTerm)) return false;
  for (const fieldTerm of fieldTerms) {
    if (fieldTerm.length < 5 || !/^[a-z0-9]+$/u.test(fieldTerm)) continue;
    if (fieldTerm.startsWith(queryTerm) || queryTerm.startsWith(fieldTerm)) return true;
  }
  return false;
}

function excerpt(value: string, query: string): string {
  const normalized = boundedText(value, MAX_SEARCH_TEXT_LENGTH).replace(/\s+/gu, " ").trim();
  const lower = normalizeSearchText(normalized);
  const index = lower.indexOf(query);
  const start = index <= 80 ? 0 : index - 80;
  const sliced = Array.from(normalized).slice(start, start + MAX_EXCERPT_LENGTH).join("");
  return `${start > 0 ? "..." : ""}${sliced}${Array.from(normalized).length > start + MAX_EXCERPT_LENGTH ? "..." : ""}`;
}

function safePageUrl(baseUrl: string, route: string): string | undefined {
  try {
    const base = new URL(baseUrl);
    if ((base.protocol !== "https:" && base.protocol !== "http:") || base.username || base.password) return undefined;
    const url = new URL(route, base);
    return url.origin === base.origin ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function boundedText(value: string, maxCodePoints: number): string {
  return Array.from(value).slice(0, maxCodePoints).join("");
}

function boundedJoin<T>(values: T[] | undefined, select: (value: T) => string = String): string | undefined {
  if (!values) return undefined;
  let result = "";
  for (const value of values) {
    if (result.length >= MAX_SEARCH_TEXT_LENGTH) break;
    result += `${result ? " " : ""}${boundedText(select(value), MAX_SEARCH_TEXT_LENGTH - result.length)}`;
  }
  return result;
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
