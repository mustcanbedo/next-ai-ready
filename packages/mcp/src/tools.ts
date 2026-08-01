import { invokeAction, listActions, schemaToJsonSchema } from "@next-ai-ready/actions";
import type { SemanticGraph, SemanticNode } from "@next-ai-ready/core";
import { renderPageMarkdown } from "@next-ai-ready/llms";
import { z } from "zod";
import { mcpPageUri, safeMcpPageRoute } from "./resources.js";

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 50;
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 20;
const MAX_QUERY_LENGTH = 200;
const MAX_SEARCH_TEXT_LENGTH = 8_000;
const MAX_EXCERPT_LENGTH = 280;
const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 500;

const listPagesInput = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.number().int().min(1).max(MAX_LIST_LIMIT).optional(),
}).strict();

const getPageInput = z.object({
  route: z.string().min(1).max(512),
}).strict();

const searchPagesInput = z.object({
  query: z.string().min(1).max(MAX_QUERY_LENGTH),
  limit: z.number().int().min(1).max(MAX_SEARCH_LIMIT).optional(),
}).strict();

/** MCP tool call result, in the SDK's `content` envelope. */
export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * A transport-agnostic description of one MCP tool, derived from a public
 * action. We keep both the JSON Schema (for inspection / non-Zod clients)
 * and the raw Zod shape (which the `@modelcontextprotocol/sdk` `tool()` /
 * `registerTool()` APIs expect) so the binder in `@next-ai-ready/next` can
 * pick whichever the installed SDK version wants.
 */
export interface McpToolDefinition {
  name: string;
  /** Description with `whenToUse` / `whenNotToUse` folded in for tool selection. */
  description: string;
  /** JSON Schema 2020-12 of the input. */
  inputSchema: Record<string, unknown>;
  /** Zod raw shape (`schema.shape`) when the input is a Zod object, else `{}`. */
  inputShape: Record<string, unknown>;
  /** Execute the tool — delegates to `invokeAction` so all security rules apply. */
  execute(args: unknown, request?: Request): Promise<McpToolResult>;
}

/**
 * Build MCP tool definitions from the current action registry.
 *
 * Only `public: true` actions are exposed (ADR-010). The executor reuses
 * `invokeAction`, so the same validation + auth + error mapping that guards
 * the HTTP surface guards the MCP surface — zero duplicated security logic.
 */
export function toMcpToolDefinitions(): McpToolDefinition[] {
  return listActions()
    .filter((a) => a.public)
    .map((action) => ({
      name: action.name,
      description: foldDescription(action.description, action.whenToUse, action.whenNotToUse),
      inputSchema: schemaToJsonSchema(action.input),
      inputShape: extractShape(action.input),
      async execute(args: unknown, request?: Request): Promise<McpToolResult> {
        // stdio transport has no HTTP request; synthesize a local one so
        // `auth` hooks still receive a Request (they'll typically deny, which
        // is the safe default for unauthenticated local clients).
        const req = request ?? new Request("http://mcp.local/");
        const result = await invokeAction(action.name, args, req);
        if (result.ok) {
          return { content: [{ type: "text", text: stringify(result.data) }] };
        }
        return {
          content: [
            {
              type: "text",
              text: stringify({ error: result.code, message: result.message, details: result.details }),
            },
          ],
          isError: true,
        };
      },
    }));
}

/** Build the read-only discovery tools backed by a pre-built SemanticGraph. */
export function toMcpPageToolDefinitions(graph: SemanticGraph): McpToolDefinition[] {
  return [
    createGraphTool(
      "list_pages",
      "List AI-readable site pages in deterministic route order. Use the returned cursor to continue browsing large sites.",
      listPagesInput,
      (input) => {
        const cursor = input.cursor === undefined ? undefined : safeMcpPageRoute(input.cursor);
        if (cursor === null) return toolError("invalid_input", "cursor must be a safe site route");

        const routes = safeGraphRoutes(graph);
        const start = cursor === undefined ? 0 : firstRouteAfter(routes, cursor);
        const limit = input.limit ?? DEFAULT_LIST_LIMIT;
        const selected = routes.slice(start, start + limit);
        const nextCursor = start + selected.length < routes.length ? selected.at(-1) ?? null : null;
        return toolSuccess({
          pages: selected.map((route) => pageSummary(graph, route)),
          nextCursor,
          total: routes.length,
        });
      },
    ),
    createGraphTool(
      "get_page",
      "Read the full AI-ready Markdown for one site page. Pass a route returned by list_pages or search_pages.",
      getPageInput,
      (input) => {
        const route = safeMcpPageRoute(input.route);
        if (route === null) return toolError("invalid_input", "route must be a safe absolute site route");
        if (!Object.prototype.hasOwnProperty.call(graph.routes, route)) {
          return toolError("not_found", `No page exists for route ${JSON.stringify(route)}`);
        }
        const markdown = renderPageMarkdown(graph, route);
        if (markdown === null) return toolError("not_found", `No readable page exists for route ${JSON.stringify(route)}`);
        return toolSuccess({ ...pageSummary(graph, route), markdown });
      },
    ),
    createGraphTool(
      "search_pages",
      "Search page titles, routes, summaries, topics, questions, entities, and content using deterministic local lexical ranking.",
      searchPagesInput,
      (input) => {
        const query = normalizeSearchText(input.query);
        const terms = [...new Set(tokenize(query))];
        if (!query || terms.length === 0) return toolError("invalid_input", "query must contain letters or numbers");

        const limit = input.limit ?? DEFAULT_SEARCH_LIMIT;
        const ranked: RankedPage[] = [];
        let totalMatches = 0;
        for (const route of safeGraphRoutes(graph)) {
          const node = pageNode(graph, route);
          if (!node) continue;
          const candidate = rankPage(route, node, query, terms);
          if (candidate.score <= 0) continue;
          totalMatches += 1;
          insertRanked(ranked, candidate, limit);
        }

        return toolSuccess({
          query: input.query,
          results: ranked.map(({ route, score, excerpt }) => ({
            ...pageSummary(graph, route),
            score,
            excerpt,
          })),
          totalMatches,
        });
      },
    ),
  ];
}

type GraphToolSchema<T> = z.ZodType<T> & { shape?: Record<string, unknown> };

function createGraphTool<T>(
  name: string,
  description: string,
  schema: GraphToolSchema<T>,
  handler: (input: T) => McpToolResult,
): McpToolDefinition {
  return {
    name,
    description,
    inputSchema: schemaToJsonSchema(schema),
    inputShape: extractShape(schema),
    async execute(args: unknown): Promise<McpToolResult> {
      const parsed = schema.safeParse(args);
      if (!parsed.success) return toolError("invalid_input", "Tool input failed validation");
      return handler(parsed.data);
    },
  };
}

interface PageSummary {
  route: string;
  uri: string;
  title: string;
  summary?: string;
  url?: string;
  locale?: string;
  updatedAt?: string;
}

function pageSummary(graph: SemanticGraph, route: string): PageSummary {
  const node = pageNode(graph, route);
  return compact({
    route,
    uri: mcpPageUri(route),
    title: boundedText(node?.title ?? route, MAX_TITLE_LENGTH),
    summary: node?.summary === undefined ? undefined : boundedText(node.summary, MAX_SUMMARY_LENGTH),
    url: safePageUrl(graph.site.baseUrl, route),
    locale: node?.locale === undefined ? undefined : boundedText(node.locale, 64),
    updatedAt: node?.updatedAt === undefined ? undefined : boundedText(node.updatedAt, 64),
  });
}

function safeGraphRoutes(graph: SemanticGraph): string[] {
  return Object.keys(graph.routes)
    .filter((route) => safeMcpPageRoute(route) !== null && pageNode(graph, route) !== undefined)
    .sort(compareText);
}

function pageNode(graph: SemanticGraph, route: string): SemanticNode | undefined {
  const id = graph.routes[route];
  return id === undefined ? undefined : graph.nodes[id];
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

function firstRouteAfter(routes: string[], cursor: string): number {
  let low = 0;
  let high = routes.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const route = routes[mid];
    if (route !== undefined && compareText(route, cursor) <= 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

interface RankedPage {
  route: string;
  score: number;
  excerpt?: string;
}

function rankPage(route: string, node: SemanticNode, query: string, terms: string[]): RankedPage {
  const fields = [
    { value: route, weight: 12 },
    { value: node.title, weight: 10 },
    { value: node.summary, weight: 7 },
    { value: boundedJoin(node.topics), weight: 6 },
    { value: boundedJoin(node.questions, (item) => `${item.q} ${item.a}`), weight: 5 },
    { value: boundedJoin(node.entities, (item) => `${item.name} ${item.type}`), weight: 4 },
    { value: node.embeddingHint, weight: 3 },
    { value: node.body, weight: 1 },
  ];

  let score = 0;
  let excerptSource: string | undefined;
  for (const field of fields) {
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
      if (fieldTerms.has(term)) matched += 1;
    }
    if (matched > 0) {
      score += field.weight * matched;
      excerptSource ??= field.value;
    }
  }

  return { route, score, excerpt: excerptSource === undefined ? undefined : excerpt(excerptSource, query) };
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
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function excerpt(value: string, query: string): string {
  const normalized = boundedText(value, MAX_SEARCH_TEXT_LENGTH).replace(/\s+/gu, " ").trim();
  const lower = normalizeSearchText(normalized);
  const index = lower.indexOf(query);
  const start = index <= 80 ? 0 : index - 80;
  const sliced = Array.from(normalized).slice(start, start + MAX_EXCERPT_LENGTH).join("");
  return `${start > 0 ? "..." : ""}${sliced}${Array.from(normalized).length > start + MAX_EXCERPT_LENGTH ? "..." : ""}`;
}

function boundedText(value: string, maxCodePoints: number): string {
  let result = "";
  let count = 0;
  for (const codePoint of value) {
    if (count >= maxCodePoints) break;
    result += codePoint;
    count += 1;
  }
  return result;
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

function toolSuccess(data: unknown): McpToolResult {
  return { content: [{ type: "text", text: stringify(data) }] };
}

function toolError(code: string, message: string): McpToolResult {
  return { content: [{ type: "text", text: stringify({ error: code, message }) }], isError: true };
}

function foldDescription(desc: string, whenToUse?: string, whenNotToUse?: string): string {
  const parts = [desc.trim()];
  if (whenToUse) parts.push(`Use when: ${whenToUse.trim()}`);
  if (whenNotToUse) parts.push(`Do not use when: ${whenNotToUse.trim()}`);
  return parts.join(" ");
}

function stringify(data: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

/**
 * Pull the Zod raw shape from an object schema. The SDK registers tools with
 * a `ZodRawShape` (a plain object of Zod types), not a full schema.
 */
function extractShape(schema: unknown): Record<string, unknown> {
  if (schema && typeof schema === "object" && "shape" in schema) {
    const shape = (schema as { shape: unknown }).shape;
    if (shape && typeof shape === "object") return shape as Record<string, unknown>;
  }
  return {};
}
