import { describe, expect, it } from "vitest";
import { runAudit } from "../src/cli/audit.js";
import fixtures from "./fixtures/external-audit.json";

type FixtureProfile = "ai-ready" | "explicit-markdown-only" | "html-only";

interface ExternalAuditFixture {
  id: string;
  profile: FixtureProfile;
  sourceUrl: string;
  capturedAt: string;
  officialAudit: {
    packageVersion: string;
    target: string;
    score: number;
  };
  expected: {
    readabilityScore: number;
    readabilityStatus: "pass" | "warn" | "fail";
    failedChecks: string[];
    warningChecks: string[];
  };
}

const PAGE_MARKDOWN = `---
title: External compatibility fixture
description: A minimal response shape captured from an external documentation site.
canonical_url: https://fixture.test/docs
last_updated: 2026-08-01
---

# External compatibility fixture

This fixture preserves protocol behavior without copying third-party page content.
`;

const MISSING_PATH = "/ai-ready-audit-missing-page-9f8e7d6c";

describe("Audit v3 external compatibility fixtures", () => {
  it.each(fixtures as ExternalAuditFixture[])(
    "$id preserves the captured compatibility result without live network access",
    async (fixture) => {
      const result = await runAudit(fixture.sourceUrl, {
        version: "3",
        fetch: createFixtureFetch(fixture.profile),
      });
      const readability = result.planes.find((plane) => plane.id === "agent-readability");
      const failedChecks = result.checks.filter((check) => check.status === "fail").map((check) => check.id);
      const warningChecks = result.checks.filter((check) => check.status === "warn").map((check) => check.id);

      expect(fixture.officialAudit.packageVersion).toBe(result.methodology.version);
      expect(fixture.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(
        readability,
        JSON.stringify({ failedChecks, warningChecks }),
      ).toMatchObject({
        score: fixture.expected.readabilityScore,
        status: fixture.expected.readabilityStatus,
      });
      expect(failedChecks).toEqual(expect.arrayContaining(fixture.expected.failedChecks));
      expect(warningChecks).toEqual(expect.arrayContaining(fixture.expected.warningChecks));
    },
  );
});

function createFixtureFetch(profile: FixtureProfile): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    const wantsMarkdown = headers.get("accept")?.includes("text/markdown") ?? false;
    const isAgent = headers.get("user-agent")?.includes("GPTBot") ?? false;
    const isPage = url.pathname === "/" || url.pathname === "/docs" || url.pathname.includes("/docs/");
    const isMarkdownPage = url.pathname === "/index.md" || url.pathname === "/docs.md" || url.pathname.endsWith(".md");

    if (url.pathname === "/llms.txt" && profile !== "html-only") {
      return textResponse(
        "# External fixture\n\n> Compatibility snapshot.\n\n- [Docs](/docs)\n",
        "text/plain; charset=utf-8",
      );
    }
    if (url.pathname === "/sitemap.xml" && profile !== "html-only") {
      return textResponse(
        `<?xml version="1.0"?><urlset><url><loc>${url.origin}/docs</loc><lastmod>2026-08-01</lastmod></url></urlset>`,
        "application/xml; charset=utf-8",
      );
    }
    if (url.pathname === "/sitemap.md") {
      return profile === "ai-ready"
        ? textResponse("# Sitemap\n\n- [Docs](/docs)\n", "text/markdown; charset=utf-8")
        : textResponse("Not found", "text/plain; charset=utf-8", 404);
    }
    if (url.pathname === "/robots.txt" && profile !== "html-only") {
      return textResponse(
        `User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`,
        "text/plain; charset=utf-8",
      );
    }
    if (url.pathname === MISSING_PATH) {
      if (profile === "html-only" || !wantsMarkdown) return textResponse("Not found", "text/html", 404);
      return textResponse("# Page not found\n", "text/markdown; charset=utf-8");
    }
    if (isMarkdownPage && profile !== "html-only") {
      return textResponse(PAGE_MARKDOWN, "text/markdown; charset=utf-8");
    }
    if (isPage) {
      if (profile === "ai-ready" && (wantsMarkdown || isAgent)) {
        return textResponse(PAGE_MARKDOWN, "text/markdown; charset=utf-8", 200, {
          vary: "Accept, User-Agent",
          link: `<${url.origin}${url.pathname}>; rel="canonical"`,
        });
      }
      return textResponse(pageHtml(url, profile), "text/html; charset=utf-8");
    }
    return textResponse("Not found", "text/plain; charset=utf-8", 404);
  };
}

function pageHtml(url: URL, profile: FixtureProfile): string {
  const markdownPath = url.pathname === "/" ? "/index.md" : `${url.pathname}.md`;
  const semanticMetadata = profile === "html-only"
    ? ""
    : `<meta name="description" content="A deterministic external compatibility fixture for Audit v3 regression coverage.">
    <link rel="canonical" href="${url.origin}${url.pathname}">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"TechArticle"}</script>`;
  const markdownAlternate = profile === "ai-ready"
    ? `<link rel="alternate" type="text/markdown" href="${markdownPath}">`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <title>External compatibility fixture</title>
    ${semanticMetadata}
    ${markdownAlternate}
  </head>
  <body><main><h1>External compatibility fixture</h1><h2>Overview</h2><h2>Usage</h2></main></body>
</html>`;
}

function textResponse(
  body: string,
  contentType: string,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, { status, headers: { "content-type": contentType, ...headers } });
}
