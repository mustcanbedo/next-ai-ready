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

export interface AuditOptions {
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

/** Audit the deployed behavior that crawlers and agents actually receive. */
export async function runAudit(target: string, options: AuditOptions = {}): Promise<AuditResult> {
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
  add(
    "agent-markdown-404",
    "Agent missing-page recovery",
    agentNotFoundOk ? "pass" : "warn",
    agentNotFoundOk
      ? "An agent requesting a missing URL receives actionable Markdown with HTTP 200."
      : responseFailure(
          agentNotFound,
          "Expected HTTP 200 recovery Markdown with noindex and a navigation or discovery link. This is advisory in audit report v1.",
        ),
    missingUrl,
    WEIGHTS.agentNotFound,
  );

  const earned = weightedChecks.reduce(
    (sum, check) => sum + (check.status === "pass" ? check.weight : check.status === "warn" ? check.weight / 2 : 0),
    0,
  );
  const total = weightedChecks.reduce((sum, check) => sum + check.weight, 0);
  const checks = weightedChecks.map(({ weight: _weight, ...check }) => check);

  return {
    version: "1",
    timestamp: new Date().toISOString(),
    target: requestedUrl.toString(),
    pageUrl: pageUrl.toString(),
    score: Math.round((earned / total) * 100),
    checks,
    errors: checks.filter((check) => check.status === "fail").length,
    warnings: checks.filter((check) => check.status === "warn").length,
    passed: checks.filter((check) => check.status === "pass").length,
  };
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

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1]!.toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attrs;
}
