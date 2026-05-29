/**
 * @next-ai-ready/core — Type contract for the entire ecosystem.
 *
 * IMPORTANT: These types are the public interface shared by every package.
 * Breaking changes here are a major version bump for the whole stack.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Site
// ─────────────────────────────────────────────────────────────────────────────

export interface SiteInfo {
  /** Human-readable site name, e.g. "Acme". */
  name: string;
  /** Absolute base URL, no trailing slash, e.g. "https://acme.com". */
  baseUrl: string;
  /** Short description, used in `llms.txt` header and Organization JSON-LD. */
  description?: string;
  organization?: {
    name: string;
    url?: string;
    logo?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic graph
// ─────────────────────────────────────────────────────────────────────────────

export type SemanticNodeKind =
  | "page"
  | "section"
  | "faq"
  | "entity"
  | "chunk";

export interface SemanticAuthor {
  name: string;
  url?: string;
}

export interface SemanticEntity {
  name: string;
  /** Schema.org type or a freeform tag, e.g. "Product", "Person". */
  type: string;
  url?: string;
}

export interface SemanticFaq {
  q: string;
  a: string;
}

export interface SemanticSource {
  file: string;
  line?: number;
}

export interface SemanticNode {
  /** Stable hash derived from `route + section path`. Deterministic. */
  id: string;
  /** Owning route, e.g. "/docs/getting-started". */
  route: string;
  kind: SemanticNodeKind;
  title?: string;
  summary?: string;
  topics?: string[];
  questions?: SemanticFaq[];
  entities?: SemanticEntity[];
  /** Clean Markdown body (JSX stripped or mapped). */
  body?: string;
  /**
   * Canonical, citable URL for this unit — page URL plus heading anchor.
   * Example: "https://acme.com/docs/getting-started#install".
   * AI engines need this to cite specific facts, not whole pages.
   */
  citeUrl?: string;
  /** ISO-8601 date. Required for AI-search trust signals. */
  updatedAt?: string;
  author?: SemanticAuthor;
  /** Optional reviewer/editor (E-E-A-T signal). */
  reviewedBy?: SemanticAuthor;
  /** Text optimized for embedding (typically `title + summary + body`). */
  embeddingHint?: string;
  /** Child node ids. The graph stores nodes flat in `SemanticGraph.nodes`. */
  children?: string[];
  source: SemanticSource;
}

export interface SemanticGraph {
  /** Flat node store keyed by id. */
  nodes: Record<string, SemanticNode>;
  /** Route → root node id. */
  routes: Record<string, string>;
  site: SiteInfo;
  /** ISO-8601 build timestamp (only metadata field — not used for diffing). */
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Capability — actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * We use a *structural* Zod-like type to avoid forcing a hard dependency on
 * zod from `core`. Any object with `parse` + `safeParse` works; in practice
 * this is `z.ZodType<T>`.
 */
export interface SchemaLike<T = unknown> {
  parse(input: unknown): T;
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: unknown };
}

export interface ActionContext {
  /** The incoming Fetch API request. */
  request: Request;
  /** Convenience alias for `request.headers`. */
  headers: Headers;
  /** Read-only cookie accessor. */
  cookies: { get(name: string): { value: string } | undefined };
  /**
   * Identifier of the caller, when inferable (e.g. MCP client name,
   * AI bot UA, or a custom auth principal).
   */
  caller?: string;
}

export interface ActionExample<I = unknown, O = unknown> {
  input: I;
  output?: O;
}

export interface ActionDefinition<I = unknown, O = unknown> {
  /** Unique identifier. Snake_case enforced at registration time. */
  name: string;
  /** Human-readable description (shown in OpenAPI). */
  description: string;
  /**
   * Guidance for AI tool selection: under what user intent should an agent
   * pick this tool? Surfaced as `x-ai-when-to-use` in OpenAPI and prepended
   * to the MCP tool description.
   */
  whenToUse?: string;
  /** Negative guidance — when an agent should NOT use this tool. */
  whenNotToUse?: string;
  input: SchemaLike<I>;
  output?: SchemaLike<O>;
  tags?: string[];
  examples?: ActionExample<I, O>[];
  /**
   * Exposure flag. Defaults to `false`. An action is **not** reachable via
   * HTTP/MCP unless this is explicitly `true`. (See ADR-010.)
   */
  public?: boolean;
  /**
   * Per-action auth gate. Runs before the handler; return falsy to reject.
   */
  auth?: (req: Request) => boolean | Promise<boolean>;
  handler: (input: I, ctx: ActionContext) => Promise<O> | O;
}

/**
 * Serializable form of an action — strips functions, keeps JSON Schemas.
 * Written to `.next-ai-ready/actions.manifest.json` and read by emitters.
 */
export interface ActionManifestEntry {
  name: string;
  description: string;
  whenToUse?: string;
  whenNotToUse?: string;
  tags?: string[];
  public: boolean;
  /** JSON Schema 2020-12. */
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  examples?: ActionExample[];
}

export interface ActionsManifest {
  actions: ActionManifestEntry[];
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Observability
// ─────────────────────────────────────────────────────────────────────────────

export interface AiRequestInfo {
  /** Identified AI bot (e.g. "GPTBot"), or `undefined` if not recognized. */
  bot?: string;
  /** Raw User-Agent. */
  ua: string;
  /** Request path, e.g. "/docs/install.md". */
  path: string;
  /** Which AI artifact served this, e.g. "llms.txt", "page.md", "openapi.json". */
  artifact: string;
}

export interface InvokeInfo {
  action: string;
  latencyMs: number;
  ok: boolean;
  error?: { message: string; code?: string };
  /** Inferred caller (UA-based or auth-based). */
  caller?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pluggable provider (no implementation ships in MVP — see ADR-004)
// ─────────────────────────────────────────────────────────────────────────────

export interface SemanticProvider {
  /**
   * Given a Markdown body + context, return an improved summary.
   * Implementations may call an LLM; the framework treats the result as
   * opaque text and caches by content hash.
   */
  summarize?: (input: {
    body: string;
    title?: string;
    route: string;
  }) => Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export interface LlmsSectionConfig {
  title: string;
  /** Glob matched against route paths. */
  include: string;
  priority?: "high" | "normal";
  /** Cap entries shown in `/llms.txt` (full content still in `llms-full.txt`). */
  limit?: number;
}

export interface EmitConfig {
  llmsTxt?: boolean;
  llmsFullTxt?: boolean;
  pageMarkdown?: boolean;
  pageAiJson?: boolean;
  jsonLd?: boolean;
  openapi?: boolean;
  mcp?: { http?: boolean; stdio?: boolean };
  /** Emit `public/robots.txt`. Default `true`. */
  robots?: boolean;
}

export interface RobotsConfig {
  /**
   * Policy for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, …).
   *   • "allow"  — explicitly Allow each known AI bot (default; the whole
   *                point of this framework is to be AI-readable).
   *   • "disallow" — Disallow each known AI bot.
   */
  aiBots?: "allow" | "disallow";
  /** Extra raw lines appended verbatim (e.g. custom `Disallow:` rules). */
  extra?: string[];
  /**
   * Whether to advertise the sitemap. If a string, used as-is; if `true`,
   * defaults to `${baseUrl}/sitemap.xml`. Default: `false` (we don't generate
   * sitemaps in MVP, so we don't claim one exists).
   */
  sitemap?: boolean | string;
}

export interface SemanticExtractConfig {
  faq?: boolean;
  entities?: boolean;
  /** "auto" = deterministic heuristic; or supply a provider for LLM-based. */
  summary?: "auto" | SemanticProvider;
}

export interface ChunkConfig {
  maxTokens?: number;
  overlap?: number;
}

export interface AiReadyHooks {
  /** Fired when an AI bot fetches an AI artifact. */
  onAiRequest?: (info: AiRequestInfo) => void | Promise<void>;
  /** Fired after an action invocation (success or failure). */
  onInvoke?: (info: InvokeInfo) => void | Promise<void>;
}

export interface AiReadyConfig {
  site: SiteInfo;
  /** Glob list for content discovery. Defaults to `["app/**\/*.{md,mdx}", "content/**\/*.mdx"]`. */
  content?: string[];
  /**
   * Either an inline list of actions, or a module path resolved relative to
   * the project root (e.g. `"./actions/index"`).
   *
   * The element type uses `any` generics deliberately: each `defineAction`
   * call produces a differently-parameterized `ActionDefinition<I, O>`, and
   * those don't widen to a shared `<unknown, unknown>` because the handler is
   * contravariant in its input. `any` is the only sound erasure for a
   * heterogeneous array.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: ActionDefinition<any, any>[] | string;
  emit?: EmitConfig;
  llms?: {
    sections?: LlmsSectionConfig[];
    exclude?: string[];
  };
  semantic?: {
    chunk?: ChunkConfig;
    extract?: SemanticExtractConfig;
  };
  mdx?: {
    /** Map JSX component name → Markdown text renderer. */
    components?: Record<string, (props: Record<string, unknown>) => string>;
  };
  robots?: RobotsConfig;
  hooks?: AiReadyHooks;
}
