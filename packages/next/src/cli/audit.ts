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
  const missingUrl = new URL("/_next-ai-ready-audit-missing", origin);
  const discoveryUrls = {
    llms: new URL("/llms.txt", origin),
    sitemapXml: new URL("/sitemap.xml", origin),
    sitemapMd: new URL("/sitemap.md", origin),
    robots: new URL("/robots.txt", origin),
  };

  const [llms, sitemapXml, sitemapMd, robots, acceptMarkdown, agentUserAgent, explicitMarkdown, notFound] =
    await Promise.all([
      fetchText(fetchImpl, discoveryUrls.llms, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.sitemapXml, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.sitemapMd, {}, timeoutMs),
      fetchText(fetchImpl, discoveryUrls.robots, {}, timeoutMs),
      fetchText(fetchImpl, pageUrl, { headers: { Accept: "text/markdown" } }, timeoutMs),
      fetchText(fetchImpl, pageUrl, { headers: { "User-Agent": "GPTBot/1.0" } }, timeoutMs),
      fetchText(fetchImpl, markdownUrl, {}, timeoutMs),
      fetchText(fetchImpl, missingUrl, {}, timeoutMs),
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

  const acceptOk = isMarkdown(acceptMarkdown);
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

  const agentUaOk = isMarkdown(agentUserAgent);
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

  const explicitOk = isMarkdown(explicitMarkdown);
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

  const markdownResponse = acceptOk ? acceptMarkdown : explicitMarkdown;
  const vary = markdownResponse.headers.get("vary")?.toLowerCase() ?? "";
  const canonicalLink = markdownResponse.headers.get("link") ?? "";
  const contentLocation = markdownResponse.headers.get("content-location") ?? "";
  const headersOk = vary.includes("accept") && vary.includes("user-agent") && /rel=["']?canonical/i.test(canonicalLink) && contentLocation.length > 0;
  add(
    "markdown-headers",
    "Markdown response metadata",
    headersOk ? "pass" : "warn",
    headersOk
      ? "Markdown includes Vary, canonical Link, and Content-Location headers."
      : "Add Vary: Accept, User-Agent plus canonical Link and Content-Location headers.",
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

  const notFoundOk = notFound.status === 404;
  add(
    "real-404",
    "Missing-page semantics",
    notFoundOk ? "pass" : "fail",
    notFoundOk ? "A missing URL returns HTTP 404." : `Expected HTTP 404, received ${notFound.status || "a network error"}.`,
    missingUrl,
    WEIGHTS.notFound,
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
