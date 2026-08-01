import { AiReadyError } from "./errors.js";

export type AuditStatus = "pass" | "warn" | "fail";

export interface AuditCheck {
  id: string;
  name: string;
  status: AuditStatus;
  message: string;
  url: string;
}

export interface AuditResult {
  version: "1";
  timestamp: string;
  target: string;
  pageUrl: string;
  score: number;
  checks: AuditCheck[];
  errors: number;
  warnings: number;
  passed: number;
}

export const AUDIT_V2_SCHEMA = "next-ai-ready.audit.v2" as const;

export type AuditDimensionId =
  | "discovery"
  | "content-citation"
  | "structured-data"
  | "agent-access"
  | "capabilities";

export interface AuditV2Check extends AuditCheck {
  dimension: AuditDimensionId;
  /** Relative contribution to the score for this check's dimension. */
  weight: number;
  /** A targeted fix for warn/fail results; null when the check passes. */
  recommendation: string | null;
}

export interface AuditDimensionResult {
  id: AuditDimensionId;
  name: string;
  score: number;
  /** Contribution of this dimension to the overall 100-point score. */
  weight: number;
  status: AuditStatus;
  errors: number;
  warnings: number;
  passed: number;
  checks: string[];
}

export interface AuditV2Result {
  schema: typeof AUDIT_V2_SCHEMA;
  version: "2";
  timestamp: string;
  target: string;
  pageUrl: string;
  score: number;
  dimensions: AuditDimensionResult[];
  checks: AuditV2Check[];
  errors: number;
  warnings: number;
  passed: number;
}

export const AUDIT_V3_SCHEMA = "next-ai-ready.audit.v3" as const;
export const VERCEL_AGENT_READABILITY_VERSION = "0.5.0" as const;

export type AuditPlaneId = "agent-readability" | "semantic-aeo-quality" | "agent-capability";
export type AuditCheckSource = "external-standard" | "next-ai-ready-enhancement";
export type AuditCheckTier = "required" | "recommended" | "enhancement";

export interface AuditV3Check extends AuditCheck {
  planes: AuditPlaneId[];
  source: AuditCheckSource;
  tier: AuditCheckTier;
  points: number;
  recommendation: string | null;
}

export interface AuditPlaneResult {
  id: AuditPlaneId;
  name: string;
  score: number;
  status: AuditStatus;
  errors: number;
  warnings: number;
  passed: number;
  checks: string[];
}

export interface AuditV3Result {
  schema: typeof AUDIT_V3_SCHEMA;
  version: "3";
  timestamp: string;
  target: string;
  pageUrl: string;
  /** Compatibility score: the local Agent Readability preflight score. */
  score: number;
  methodology: {
    name: "next-ai-ready three-plane preflight";
    package: "@vercel/agent-readability";
    version: typeof VERCEL_AGENT_READABILITY_VERSION;
    scoring: "required=3,recommended=2,strict-pass-only";
    coverage: "local-subset-official-cli-is-source-of-truth";
    officialCommand: string;
    referenceUrl: string;
  };
  planes: AuditPlaneResult[];
  checks: AuditV3Check[];
  errors: number;
  warnings: number;
  passed: number;
}

export interface AuditOptions {
  version?: "1";
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AuditV2Options {
  version: "2";
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

export interface AuditV3Options {
  version: "3";
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

interface FetchResult {
  url: string;
  status: number;
  ok: boolean;
  headers: Headers;
  body: string;
  error?: string;
}

const WEIGHTS = {
  html: 10,
  llms: 10,
  sitemapXml: 4,
  sitemapMd: 4,
  robots: 4,
  acceptMarkdown: 12,
  agentUserAgent: 8,
  explicitMarkdown: 10,
  markdownHeaders: 8,
  markdownFrontmatter: 6,
  canonical: 6,
  description: 4,
  jsonLd: 4,
  h1: 4,
  notFound: 6,
  // Compatibility-only in report v1: expose the new check without changing
  // legacy scores or turning previously passing CI gates into failures.
  agentNotFound: 0,
} as const;

interface AuditV2CheckConfig {
  dimension: AuditDimensionId;
  weight: number;
  recommendation: string;
}

interface AuditV2DimensionConfig {
  name: string;
  weight: number;
}

const AUDIT_V2_DIMENSIONS: Record<AuditDimensionId, AuditV2DimensionConfig> = {
  discovery: { name: "Discovery", weight: 20 },
  "content-citation": { name: "Content and citation", weight: 25 },
  "structured-data": { name: "Structured data", weight: 15 },
  "agent-access": { name: "Agent access", weight: 30 },
  capabilities: { name: "Capabilities", weight: 10 },
};

const AUDIT_V2_CHECKS: Record<string, AuditV2CheckConfig> = {
  "html-response": {
    dimension: "content-citation",
    weight: 4,
    recommendation: "Return a successful text/html response for the audited browser URL.",
  },
  "llms-txt": {
    dimension: "discovery",
    weight: 4,
    recommendation: "Publish a non-empty /llms.txt with content-type text/plain and links to important pages.",
  },
  "sitemap-xml": {
    dimension: "discovery",
    weight: 2,
    recommendation: "Publish a valid, non-empty /sitemap.xml with an XML content type.",
  },
  "sitemap-md": {
    dimension: "discovery",
    weight: 2,
    recommendation: "Publish a non-empty /sitemap.md with content-type text/markdown for agent navigation.",
  },
  "robots-txt": {
    dimension: "discovery",
    weight: 2,
    recommendation: "Publish a non-empty /robots.txt with content-type text/plain and advertise the XML sitemap.",
  },
  "accept-markdown": {
    dimension: "agent-access",
    weight: 4,
    recommendation: "Serve the page as text/markdown when the request sends Accept: text/markdown.",
  },
  "agent-user-agent": {
    dimension: "agent-access",
    weight: 2,
    recommendation: "Serve Markdown to supported AI user agents, or document that agents must use explicit Markdown URLs.",
  },
  "explicit-markdown": {
    dimension: "capabilities",
    weight: 3,
    recommendation: "Expose a stable explicit Markdown URL, using /index.md for the root page and <path>.md elsewhere.",
  },
  "markdown-headers": {
    dimension: "agent-access",
    weight: 2,
    recommendation: "Advertise the Markdown relation and include Vary: Accept and Vary: User-Agent whenever those headers change the representation.",
  },
  "markdown-frontmatter": {
    dimension: "content-citation",
    weight: 2,
    recommendation: "Begin the Markdown representation with YAML frontmatter containing stable title, description, and canonical metadata.",
  },
  "html-canonical": {
    dimension: "content-citation",
    weight: 2,
    recommendation: 'Add a non-empty <link rel="canonical"> to the HTML page.',
  },
  "meta-description": {
    dimension: "content-citation",
    weight: 1,
    recommendation: "Add a concise, non-empty meta description that identifies the page's purpose.",
  },
  "json-ld": {
    dimension: "structured-data",
    weight: 1,
    recommendation: "Add valid application/ld+json using the most specific Schema.org type for this page.",
  },
  "page-h1": {
    dimension: "content-citation",
    weight: 1,
    recommendation: "Add one descriptive H1 that clearly states the page's primary subject.",
  },
  "real-404": {
    dimension: "agent-access",
    weight: 2,
    recommendation: "Return HTTP 404 for a missing URL requested as a browser document so crawlers do not index soft 404s.",
  },
  "agent-markdown-404": {
    dimension: "capabilities",
    weight: 1,
    recommendation: "For missing Markdown requests, return actionable recovery Markdown with noindex and a link to /llms.txt, /sitemap.md, or a relevant page.",
  },
};

interface AuditV3CheckConfig {
  planes: AuditPlaneId[];
  source: AuditCheckSource;
  tier: AuditCheckTier;
  recommendation: string;
}

const AUDIT_V3_PLANES: Record<AuditPlaneId, string> = {
  "agent-readability": "Agent Readability",
  "semantic-aeo-quality": "Semantic/AEO Quality",
  "agent-capability": "Agent Capability",
};

const AUDIT_V3_CHECKS: Record<string, AuditV3CheckConfig> = {
  "html-response": standard(["agent-readability"], "required", "Return successful server-rendered HTML."),
  "llms-txt": standard(["agent-readability"], "required", "Publish a non-empty /llms.txt."),
  "sitemap-xml": standard(["agent-readability"], "required", "Publish /sitemap.xml with lastmod dates."),
  "sitemap-md": standard(["agent-readability"], "recommended", "Publish a structured Markdown sitemap."),
  "robots-txt": standard(["agent-readability"], "required", "Allow major AI crawlers in robots.txt."),
  "accept-markdown": standard(
    ["agent-readability"],
    "recommended",
    "Serve Markdown for Accept: text/markdown.",
  ),
  "agent-user-agent": standard(
    ["agent-readability"],
    "required",
    "Serve Markdown to supported AI user agents.",
  ),
  "explicit-markdown": standard(
    ["agent-readability"],
    "required",
    "Expose a stable .md representation for the page.",
  ),
  "markdown-headers": standard(
    ["agent-readability"],
    "recommended",
    "Advertise Markdown and set cache-safe Vary headers.",
  ),
  "markdown-frontmatter": standard(
    ["agent-readability", "semantic-aeo-quality"],
    "recommended",
    "Include title, description, canonical URL, and freshness metadata in Markdown frontmatter.",
  ),
  "html-canonical": standard(
    ["agent-readability", "semantic-aeo-quality"],
    "recommended",
    "Add a canonical URL to the HTML page.",
  ),
  "meta-description": standard(
    ["agent-readability", "semantic-aeo-quality"],
    "recommended",
    "Add a descriptive meta description.",
  ),
  "json-ld": standard(
    ["agent-readability", "semantic-aeo-quality"],
    "recommended",
    "Add valid Schema.org JSON-LD.",
  ),
  "page-h1": standard(
    ["agent-readability", "semantic-aeo-quality"],
    "recommended",
    "Use a clear primary heading and structured subsections.",
  ),
  "real-404": standard(
    ["agent-readability"],
    "required",
    "Return a real browser HTTP 404 for missing pages.",
  ),
  "agent-markdown-404": standard(
    ["agent-readability"],
    "recommended",
    "Return HTTP 200 with Markdown for missing Agent requests.",
  ),
  "agent-markdown-recovery-quality": enhancement(
    "Add noindex plus a discovery or navigation link to Agent missing-page Markdown.",
    ["semantic-aeo-quality"],
  ),
  "tools-manifest": enhancement("Publish a valid /tools.json manifest for callable actions."),
  "openapi-spec": enhancement("Publish a valid OpenAPI 3.x document for callable actions."),
  "mcp-endpoint": enhancement(
    "Configure MCP authentication and verify an authenticated protocol response at /api/mcp/mcp.",
  ),
};

function standard(
  planes: AuditPlaneId[],
  tier: "required" | "recommended",
  recommendation: string,
): AuditV3CheckConfig {
  return { planes, source: "external-standard", tier, recommendation };
}

function enhancement(
  recommendation: string,
  planes: AuditPlaneId[] = ["agent-capability"],
): AuditV3CheckConfig {
  return {
    planes,
    source: "next-ai-ready-enhancement",
    tier: "enhancement",
    recommendation,
  };
}

/** Audit the deployed behavior that crawlers and agents actually receive. */
export function runAudit(target: string, options: AuditV2Options): Promise<AuditV2Result>;
export function runAudit(target: string, options: AuditV3Options): Promise<AuditV3Result>;
export function runAudit(target: string, options?: AuditOptions): Promise<AuditResult>;
export async function runAudit(
  target: string,
  options: AuditOptions | AuditV2Options | AuditV3Options = {},
): Promise<AuditResult | AuditV2Result | AuditV3Result> {
  const requestedUrl = parseTarget(target);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new AiReadyError("fetch_unavailable", "This Node.js runtime does not provide fetch().", [
      "Run the audit with Node.js 20 or newer.",
    ]);
  }

  const timeoutMs = options.timeoutMs ?? 10_000;
  const initialPage = await fetchText(fetchImpl, requestedUrl, {}, timeoutMs);
  const pageUrl = initialPage.ok ? new URL(initialPage.url) : requestedUrl;
  pageUrl.hash = "";

  const origin = pageUrl.origin;
  const markdownUrl = toMarkdownUrl(pageUrl);
  // Keep the probe outside Next.js and next-ai-ready reserved namespaces so
  // content negotiation can exercise the same rewrite as a normal page.
  const missingUrl = new URL("/ai-ready-audit-missing-page-9f8e7d6c", origin);
  const discoveryUrls = {
    llms: new URL("/llms.txt", origin),
    sitemapXml: new URL("/sitemap.xml", origin),
    sitemapMd: new URL("/sitemap.md", origin),
    robots: new URL("/robots.txt", origin),
  };

  const [
    llms,
    sitemapXml,
    sitemapMd,
    robots,
    acceptMarkdown,
    agentUserAgent,
    explicitMarkdown,
    htmlNotFound,
    agentNotFound,
  ] =
    await Promise.all([
      fetchText(fetchImpl, discoveryUrls.llms, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.sitemapXml, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.sitemapMd, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.robots, {}, timeoutMs),
      fetchText(fetchImpl, pageUrl, { headers: { Accept: "text/markdown" } }, timeoutMs),
      fetchText(fetchImpl, pageUrl, { headers: { "User-Agent": "GPTBot/1.0" } }, timeoutMs),
      fetchText(fetchImpl, markdownUrl, {}, timeoutMs),
      fetchText(
        fetchImpl,
        missingUrl,
        {
          headers: {
            Accept: "text/html",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "User-Agent": "Mozilla/5.0 (compatible; next-ai-ready-audit/1.0)",
          },
        },
        timeoutMs,
      ),
      fetchText(fetchImpl, missingUrl, { headers: { Accept: "text/markdown" } }, timeoutMs),
    ]);

  const weightedChecks: Array<AuditCheck & { weight: number }> = [];
  const add = (
    id: string,
    name: string,
    status: AuditStatus,
    message: string,
    url: URL | string,
    weight: number,
  ) => weightedChecks.push({ id, name, status, message, url: String(url), weight });

  const htmlType = contentType(initialPage);
  const htmlOk = initialPage.ok && htmlType.includes("text/html");
  add(
    "html-response",
    "HTML page",
    htmlOk ? "pass" : "fail",
    htmlOk
      ? `Page returned ${initialPage.status} as HTML.`
      : responseFailure(initialPage, "Expected a successful text/html response."),
    requestedUrl,
    WEIGHTS.html,
  );

  addDiscoveryCheck(add, "llms-txt", "llms.txt", llms, discoveryUrls.llms, "text/plain", WEIGHTS.llms, true);
  addDiscoveryCheck(add, "sitemap-xml", "sitemap.xml", sitemapXml, discoveryUrls.sitemapXml, "xml", WEIGHTS.sitemapXml);
  addDiscoveryCheck(add, "sitemap-md", "sitemap.md", sitemapMd, discoveryUrls.sitemapMd, "markdown", WEIGHTS.sitemapMd);
  addDiscoveryCheck(add, "robots-txt", "robots.txt", robots, discoveryUrls.robots, "text/plain", WEIGHTS.robots);

  const acceptOk = isPageMarkdown(acceptMarkdown);
  add(
    "accept-markdown",
    "Accept negotiation",
    acceptOk ? "pass" : "fail",
    acceptOk
      ? "Accept: text/markdown returned a Markdown representation."
      : responseFailure(acceptMarkdown, "Accept: text/markdown did not return Markdown."),
    pageUrl,
    WEIGHTS.acceptMarkdown,
  );

  const agentUaOk = isPageMarkdown(agentUserAgent);
  add(
    "agent-user-agent",
    "AI user-agent negotiation",
    agentUaOk ? "pass" : "warn",
    agentUaOk
      ? "A known AI user-agent received Markdown."
      : responseFailure(agentUserAgent, "The AI user-agent received HTML instead of Markdown."),
    pageUrl,
    WEIGHTS.agentUserAgent,
  );

  const explicitOk = isPageMarkdown(explicitMarkdown);
  const rootCandidate = pageUrl.pathname === "/";
  add(
    "explicit-markdown",
    "Explicit Markdown URL",
    explicitOk ? "pass" : rootCandidate ? "warn" : "fail",
    explicitOk
      ? `${markdownUrl.pathname} returned Markdown.`
      : responseFailure(explicitMarkdown, `${markdownUrl.pathname} did not return Markdown.`),
    markdownUrl,
    WEIGHTS.explicitMarkdown,
  );

  const markdownResponse = acceptOk ? acceptMarkdown : explicitOk ? explicitMarkdown : acceptMarkdown;
  const vary = headerTokens(markdownResponse.headers.get("vary"));
  const negotiatedResponse = markdownResponse === acceptMarkdown;
  const cacheSafe = !negotiatedResponse || vary.has("accept");
  const agentVary = headerTokens(agentUserAgent.headers.get("vary"));
  const agentCacheSafe = !agentUaOk || agentVary.has("user-agent");
  const markdownLink = markdownResponse.headers.get("link") ?? "";
  const htmlLink = initialPage.headers.get("link") ?? "";
  const contentLocation = markdownResponse.headers.get("content-location") ?? "";
  const relationSignals = [
    hasLinkRelation(markdownLink, "canonical") ? "Markdown canonical Link" : null,
    contentLocation.length > 0 ? "Content-Location" : null,
    hasLinkRelation(htmlLink, "alternate", "text/markdown") ? "HTTP Markdown alternate" : null,
    findMarkdownAlternate(initialPage.body) ? "HTML Markdown alternate" : null,
  ].filter((signal): signal is string => signal !== null);
  const headersOk = cacheSafe && agentCacheSafe && relationSignals.length > 0;
  add(
    "markdown-headers",
    "Markdown response metadata",
    headersOk ? "pass" : "warn",
    headersOk
      ? `Markdown negotiation metadata is discoverable (${relationSignals.join(", ")}).`
      : !cacheSafe
        ? "Add Vary: Accept when the same URL negotiates HTML and Markdown."
        : !agentCacheSafe
          ? "Add Vary: User-Agent when the response changes for AI user agents."
          : "Advertise the Markdown representation with a canonical Link, Content-Location, or text/markdown alternate link.",
    markdownResponse.url,
    WEIGHTS.markdownHeaders,
  );

  const frontmatterOk = /^---\s*\n[\s\S]*?\n---\s*\n/.test(markdownResponse.body);
  add(
    "markdown-frontmatter",
    "Markdown frontmatter",
    frontmatterOk ? "pass" : "warn",
    frontmatterOk ? "Markdown begins with machine-readable frontmatter." : "Markdown is missing YAML frontmatter.",
    markdownResponse.url,
    WEIGHTS.markdownFrontmatter,
  );

  const canonical = findCanonical(initialPage.body);
  add(
    "html-canonical",
    "HTML canonical URL",
    canonical ? "pass" : "warn",
    canonical ? `Canonical URL: ${canonical}` : "HTML is missing <link rel=\"canonical\">.",
    pageUrl,
    WEIGHTS.canonical,
  );

  const description = findMetaDescription(initialPage.body);
  add(
    "meta-description",
    "Meta description",
    description ? "pass" : "warn",
    description ? "A non-empty meta description is present." : "HTML is missing a non-empty meta description.",
    pageUrl,
    WEIGHTS.description,
  );

  const jsonLdOk = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/i.test(initialPage.body);
  add(
    "json-ld",
    "JSON-LD",
    jsonLdOk ? "pass" : "warn",
    jsonLdOk ? "HTML includes application/ld+json." : "HTML does not include JSON-LD structured data.",
    pageUrl,
    WEIGHTS.jsonLd,
  );

  const h1Ok = /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(initialPage.body);
  add(
    "page-h1",
    "Primary heading",
    h1Ok ? "pass" : "warn",
    h1Ok ? "HTML includes an H1 heading." : "HTML does not include an H1 heading.",
    pageUrl,
    WEIGHTS.h1,
  );

  const notFoundOk = htmlNotFound.status === 404;
  add(
    "real-404",
    "Missing-page semantics",
    notFoundOk ? "pass" : "fail",
    notFoundOk
      ? "A browser-style HTML request for a missing URL returns HTTP 404."
      : `Expected an HTML HTTP 404, received ${htmlNotFound.status || "a network error"}.`,
    missingUrl,
    WEIGHTS.notFound,
  );

  const agentRecoveryBody = agentNotFound.body.trim();
  const hasRecoveryLink = /(?<!!)\[[^\]]+\]\((?:https?:\/\/|\/)[^)]+\)/i.test(agentRecoveryBody);
  const hasDiscoveryPath = /\/(?:llms\.txt|sitemap\.md)\b/i.test(agentRecoveryBody);
  const hasNoIndex = headerTokens(agentNotFound.headers.get("x-robots-tag")).has("noindex");
  const agentNotFoundOk =
    agentNotFound.status === 200 &&
    isMarkdown(agentNotFound) &&
    isRecoveryMarkdown(agentRecoveryBody) &&
    hasNoIndex &&
    (hasRecoveryLink || hasDiscoveryPath);
  const agentNotFoundMarkdownOk = agentNotFound.status === 200 && isMarkdown(agentNotFound);
  const agentNotFoundStatus = options.version === "3"
    ? agentNotFoundMarkdownOk
      ? "pass"
      : "warn"
    : agentNotFoundOk
      ? "pass"
      : "warn";
  const agentNotFoundMessage = options.version === "3"
    ? agentNotFoundMarkdownOk
      ? "An agent requesting a missing URL receives Markdown with HTTP 200."
      : responseFailure(agentNotFound, "Expected HTTP 200 Markdown for an Agent missing-page request.")
    : agentNotFoundOk
      ? "An agent requesting a missing URL receives actionable Markdown with HTTP 200."
      : responseFailure(
          agentNotFound,
          "Expected HTTP 200 recovery Markdown with noindex and a navigation or discovery link. This is advisory in audit report v1.",
        );
  add(
    "agent-markdown-404",
    "Agent missing-page recovery",
    agentNotFoundStatus,
    agentNotFoundMessage,
    missingUrl,
    WEIGHTS.agentNotFound,
  );

  if (options.version === "3") {
    add(
      "agent-markdown-recovery-quality",
      "Agent missing-page recovery quality",
      agentNotFoundOk ? "pass" : "warn",
      agentNotFoundOk
        ? "Missing-page Markdown includes noindex plus an actionable discovery or navigation link."
        : "Add X-Robots-Tag: noindex plus a discovery or navigation link to missing-page Markdown.",
      missingUrl,
      0,
    );
  }

  const timestamp = new Date().toISOString();
  if (options.version === "3") {
    const capabilityChecks = await buildCapabilityChecks(fetchImpl, origin, timeoutMs);
    return buildAuditV3Result(
      [...weightedChecks, ...capabilityChecks],
      requestedUrl,
      pageUrl,
      timestamp,
    );
  }
  if (options.version === "2") {
    return buildAuditV2Result(weightedChecks, requestedUrl, pageUrl, timestamp);
  }
  return buildAuditV1Result(weightedChecks, requestedUrl, pageUrl, timestamp);
}

function buildAuditV1Result(
  weightedChecks: Array<AuditCheck & { weight: number }>,
  requestedUrl: URL,
  pageUrl: URL,
  timestamp: string,
): AuditResult {
  const earned = weightedChecks.reduce((sum, check) => sum + statusScore(check.status) * check.weight, 0);
  const total = weightedChecks.reduce((sum, check) => sum + check.weight, 0);
  const checks = weightedChecks.map(({ weight: _weight, ...check }) => check);

  return {
    version: "1",
    timestamp,
    target: requestedUrl.toString(),
    pageUrl: pageUrl.toString(),
    score: Math.round((earned / total) * 100),
    checks,
    errors: countStatus(checks, "fail"),
    warnings: countStatus(checks, "warn"),
    passed: countStatus(checks, "pass"),
  };
}

function buildAuditV2Result(
  weightedChecks: Array<AuditCheck & { weight: number }>,
  requestedUrl: URL,
  pageUrl: URL,
  timestamp: string,
): AuditV2Result {
  const checks = weightedChecks.map(({ weight: _legacyWeight, ...check }): AuditV2Check => {
    const config = AUDIT_V2_CHECKS[check.id];
    if (!config) {
      throw new AiReadyError("unsupported_audit_v2_check", `Audit v2 has no scoring metadata for check "${check.id}".`, [
        "Add the check to AUDIT_V2_CHECKS before including it in an Audit v2 report.",
      ]);
    }
    return {
      ...check,
      dimension: config.dimension,
      weight: config.weight,
      recommendation: check.status === "pass" ? null : config.recommendation,
    };
  });

  const dimensions = (Object.entries(AUDIT_V2_DIMENSIONS) as Array<[AuditDimensionId, AuditV2DimensionConfig]>).map(
    ([id, config]): AuditDimensionResult => {
      const dimensionChecks = checks.filter((check) => check.dimension === id);
      const totalWeight = dimensionChecks.reduce((sum, check) => sum + check.weight, 0);
      const earnedWeight = dimensionChecks.reduce(
        (sum, check) => sum + statusScore(check.status) * check.weight,
        0,
      );
      const errors = countStatus(dimensionChecks, "fail");
      const warnings = countStatus(dimensionChecks, "warn");
      return {
        id,
        name: config.name,
        score: totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0,
        weight: config.weight,
        status: errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
        errors,
        warnings,
        passed: countStatus(dimensionChecks, "pass"),
        checks: dimensionChecks.map((check) => check.id),
      };
    },
  );

  const weightedDimensionScore = dimensions.reduce(
    (sum, dimension) => sum + dimension.score * dimension.weight,
    0,
  );
  const totalDimensionWeight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);

  return {
    schema: AUDIT_V2_SCHEMA,
    version: "2",
    timestamp,
    target: requestedUrl.toString(),
    pageUrl: pageUrl.toString(),
    score: Math.round(weightedDimensionScore / totalDimensionWeight),
    dimensions,
    checks,
    errors: countStatus(checks, "fail"),
    warnings: countStatus(checks, "warn"),
    passed: countStatus(checks, "pass"),
  };
}

async function buildCapabilityChecks(
  fetchImpl: typeof globalThis.fetch,
  origin: string,
  timeoutMs: number,
): Promise<Array<AuditCheck & { weight: number }>> {
  const urls = {
    tools: new URL("/tools.json", origin),
    openapi: new URL("/openapi.json", origin),
    mcp: new URL("/api/mcp/mcp", origin),
  };
  const [tools, openapi, mcp] = await Promise.all([
    fetchText(fetchImpl, urls.tools, {}, timeoutMs),
    fetchText(fetchImpl, urls.openapi, {}, timeoutMs),
    fetchText(fetchImpl, urls.mcp, {}, timeoutMs),
  ]);

  const checks: Array<AuditCheck & { weight: number }> = [];
  const add = (id: string, name: string, status: AuditStatus, message: string, url: URL) => {
    checks.push({ id, name, status, message, url: url.toString(), weight: 0 });
  };

  const toolsJson = parseJsonObject(tools.body);
  const toolEntries = Array.isArray(toolsJson?.tools) ? toolsJson.tools : [];
  const toolsOk = tools.ok && toolEntries.length > 0 && toolEntries.every(isToolDefinition);
  add(
    "tools-manifest",
    "Agent tool manifest",
    toolsOk ? "pass" : "warn",
    toolsOk
      ? `/tools.json advertises ${toolEntries.length} valid callable tool(s).`
      : "No non-empty, valid tools manifest was found.",
    urls.tools,
  );

  const openapiJson = parseJsonObject(openapi.body);
  const openapiVersion = typeof openapiJson?.openapi === "string" ? openapiJson.openapi : "";
  const openapiPaths = isRecord(openapiJson?.paths) ? openapiJson.paths : {};
  const openapiOk =
    openapi.ok &&
    openapiVersion.startsWith("3.") &&
    Object.values(openapiPaths).some(hasOpenApiOperation);
  add(
    "openapi-spec",
    "OpenAPI capability contract",
    openapiOk ? "pass" : "warn",
    openapiOk ? `OpenAPI ${openapiVersion} describes callable HTTP actions.` : "No valid OpenAPI 3.x action contract was found.",
    urls.openapi,
  );

  const mcpAuthResponse = mcp.status === 401 || mcp.status === 403;
  const mcpProtocolSignal =
    contentType(mcp).includes("text/event-stream") ||
    mcp.headers.has("mcp-session-id") ||
    /"jsonrpc"\s*:\s*"2\.0"/i.test(mcp.body);
  const mcpReachable = mcpAuthResponse || mcp.ok || [400, 405, 406, 415].includes(mcp.status);
  add(
    "mcp-endpoint",
    "MCP endpoint",
    mcpProtocolSignal ? "pass" : "warn",
    mcpProtocolSignal
      ? `MCP protocol response was detected (HTTP ${mcp.status}).`
      : mcpReachable
        ? `MCP route is reachable (HTTP ${mcp.status}), but the protocol cannot be verified without credentials.`
        : `MCP endpoint was not found (HTTP ${mcp.status || "network error"}); this enhancement is optional.`,
    urls.mcp,
  );

  return checks;
}

function buildAuditV3Result(
  rawChecks: Array<AuditCheck & { weight: number }>,
  requestedUrl: URL,
  pageUrl: URL,
  timestamp: string,
): AuditV3Result {
  const checks = rawChecks.map(({ weight: _legacyWeight, ...check }): AuditV3Check => {
    const config = AUDIT_V3_CHECKS[check.id];
    if (!config) {
      throw new AiReadyError("unsupported_audit_v3_check", `Audit v3 has no metadata for check "${check.id}".`, [
        "Add the check to AUDIT_V3_CHECKS before including it in an Audit v3 report.",
      ]);
    }
    return {
      ...check,
      planes: config.planes,
      source: config.source,
      tier: config.tier,
      points: tierPoints(config.tier),
      recommendation: check.status === "pass" ? null : config.recommendation,
    };
  });

  const planes = (Object.entries(AUDIT_V3_PLANES) as Array<[AuditPlaneId, string]>).map(
    ([id, name]): AuditPlaneResult => {
      const planeChecks = checks.filter((check) => check.planes.includes(id));
      const total = planeChecks.reduce((sum, check) => sum + check.points, 0);
      const earned = planeChecks.reduce((sum, check) => sum + (check.status === "pass" ? check.points : 0), 0);
      const errors = countStatus(planeChecks, "fail");
      const warnings = countStatus(planeChecks, "warn");
      return {
        id,
        name,
        score: total > 0 ? Math.round((earned / total) * 100) : 0,
        status: errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
        errors,
        warnings,
        passed: countStatus(planeChecks, "pass"),
        checks: planeChecks.map((check) => check.id),
      };
    },
  );
  const readability = planes.find((plane) => plane.id === "agent-readability");

  return {
    schema: AUDIT_V3_SCHEMA,
    version: "3",
    timestamp,
    target: requestedUrl.toString(),
    pageUrl: pageUrl.toString(),
    score: readability?.score ?? 0,
    methodology: {
      name: "next-ai-ready three-plane preflight",
      package: "@vercel/agent-readability",
      version: VERCEL_AGENT_READABILITY_VERSION,
      scoring: "required=3,recommended=2,strict-pass-only",
      coverage: "local-subset-official-cli-is-source-of-truth",
      officialCommand: "pnpm audit:vercel:site",
      referenceUrl: "https://vercel.com/kb/guide/agent-readability-spec",
    },
    planes,
    checks,
    errors: countStatus(checks, "fail"),
    warnings: countStatus(checks, "warn"),
    passed: countStatus(checks, "pass"),
  };
}

function tierPoints(tier: AuditCheckTier): number {
  return tier === "required" ? 3 : tier === "recommended" ? 2 : 1;
}

function statusScore(status: AuditStatus): number {
  return status === "pass" ? 1 : status === "warn" ? 0.5 : 0;
}

function countStatus(checks: AuditCheck[], status: AuditStatus): number {
  return checks.filter((check) => check.status === status).length;
}

function parseTarget(target: string): URL {
  if (!target) {
    throw new AiReadyError("missing_audit_url", "The audit command requires a deployed page URL.", [
      "Example: next-ai-ready audit https://example.com/about",
    ]);
  }
  try {
    const url = new URL(target);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    url.hash = "";
    return url;
  } catch {
    throw new AiReadyError("invalid_audit_url", `Expected an absolute HTTP(S) URL, got "${target}".`, [
      "Include the protocol, for example https://example.com/about.",
    ]);
  }
}

async function fetchText(
  fetchImpl: typeof globalThis.fetch,
  url: URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<FetchResult> {
  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
    return {
      url: response.url || url.toString(),
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body: await response.text(),
    };
  } catch (error) {
    return {
      url: url.toString(),
      status: 0,
      ok: false,
      headers: new Headers(),
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function toMarkdownUrl(pageUrl: URL): URL {
  const url = new URL(pageUrl);
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = path ? (path.endsWith(".md") ? path : `${path}.md`) : "/index.md";
  url.search = "";
  return url;
}

function contentType(result: FetchResult): string {
  return result.headers.get("content-type")?.toLowerCase() ?? "";
}

function isMarkdown(result: FetchResult): boolean {
  return result.ok && contentType(result).includes("text/markdown");
}

function isPageMarkdown(result: FetchResult): boolean {
  return isMarkdown(result) && !isRecoveryMarkdown(result.body);
}

function isRecoveryMarkdown(body: string): boolean {
  const frontmatter = body.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1] ?? "";
  return (
    /^document_status\s*:\s*["']?not_found["']?\s*$/im.test(frontmatter) ||
    /^recovery\s*:\s*true\s*$/im.test(frontmatter) ||
    /^#\s+(?:page\s+)?not found\s*$/im.test(body)
  );
}

function responseFailure(result: FetchResult, fallback: string): string {
  if (result.error) return `${fallback} Network error: ${result.error}`;
  return `${fallback} Received HTTP ${result.status} (${contentType(result) || "no content-type"}).`;
}

function addDiscoveryCheck(
  add: (id: string, name: string, status: AuditStatus, message: string, url: URL | string, weight: number) => void,
  id: string,
  name: string,
  result: FetchResult,
  url: URL,
  expectedType: string,
  weight: number,
  required = false,
): void {
  const typeOk = contentType(result).includes(expectedType);
  const ok = result.ok && result.body.trim().length > 0 && typeOk;
  add(
    id,
    name,
    ok ? "pass" : required ? "fail" : "warn",
    ok ? `${url.pathname} is available and non-empty.` : responseFailure(result, `${url.pathname} is missing or has the wrong content type.`),
    url,
    weight,
  );
}

function findCanonical(html: string): string | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    if (attrs.rel?.toLowerCase().split(/\s+/).includes("canonical") && attrs.href) return attrs.href;
  }
  return null;
}

function findMarkdownAlternate(html: string): string | null {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const relations = attrs.rel?.toLowerCase().split(/\s+/) ?? [];
    if (relations.includes("alternate") && attrs.type?.toLowerCase() === "text/markdown" && attrs.href) {
      return attrs.href;
    }
  }
  return null;
}

function headerTokens(value: string | null): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hasLinkRelation(value: string, relation: string, type?: string): boolean {
  const expectedRelation = relation.toLowerCase();
  const expectedType = type?.toLowerCase();

  for (const match of value.matchAll(/<([^>]*)>((?:\s*;\s*[^,]*)*)/g)) {
    const parameters: Record<string, string> = {};
    const parameterText = match[2] ?? "";
    const pattern = /;\s*([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^;,\s]+))/g;
    for (const parameter of parameterText.matchAll(pattern)) {
      parameters[parameter[1]!.toLowerCase()] = parameter[2] ?? parameter[3] ?? parameter[4] ?? "";
    }

    const relations = parameters.rel?.toLowerCase().split(/\s+/) ?? [];
    if (relations.includes(expectedRelation) && (!expectedType || parameters.type?.toLowerCase() === expectedType)) {
      return true;
    }
  }
  return false;
}

function findMetaDescription(html: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    if (attrs.name?.toLowerCase() === "description" && attrs.content?.trim()) return attrs.content.trim();
  }
  return null;
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isToolDefinition(value: unknown): boolean {
  if (!isRecord(value) || value.type !== "function" || !isRecord(value.function)) return false;
  return typeof value.function.name === "string" && value.function.name.trim().length > 0;
}

function hasOpenApiOperation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ["get", "post", "put", "patch", "delete"].some((method) => isRecord(value[method]));
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}
