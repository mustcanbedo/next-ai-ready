import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { runAudit } from "../src/cli/audit.js";

const MARKDOWN = `---
title: Audit fixture
description: A deterministic page used by the online audit test.
---

# Audit fixture

This page contains useful, machine-readable content.
`;

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Audit fixture</title>
    <meta name="description" content="A deterministic page used by the online audit test.">
    <link rel="canonical" href="__ORIGIN__/">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"WebPage","name":"Audit fixture"}
    </script>
  </head>
  <body>
    <main><h1>Audit fixture</h1><p>Useful content for agents and people.</p></main>
  </body>
</html>`;

let servers: Server[] = [];

interface FixtureOptions {
  nuxtStyleHeaders?: boolean;
  agentMissingFallback?: boolean;
  emptyAgentMissingFallback?: boolean;
}

function startFixtureServer(options: FixtureOptions = {}): Promise<{ server: Server; target: string }> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

      if (url.pathname === "/llms.txt") {
        response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        response.end("# Audit fixture\n\n- [Guide](http://example.test/guide)\n");
        return;
      }

      if (url.pathname === "/sitemap.xml") {
        response.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
        response.end(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
        return;
      }

      if (url.pathname === "/sitemap.md") {
        response.writeHead(200, { "content-type": "text/markdown; charset=utf-8" });
        response.end("# Sitemap\n\n- [Audit fixture](http://example.test/)\n");
        return;
      }

      if (url.pathname === "/robots.txt") {
        response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        response.end("User-agent: *\nAllow: /\nSitemap: " + origin + "/sitemap.xml\n");
        return;
      }

      if (url.pathname === "/" || url.pathname === "/guide") {
        if (
          request.headers.accept?.includes("text/markdown") ||
          request.headers["user-agent"]?.includes("GPTBot")
        ) {
          response.writeHead(200, {
            "content-type": "text/markdown; charset=utf-8",
            vary: options.nuxtStyleHeaders ? "Accept, Sec-Fetch-Dest" : "Accept, User-Agent",
            ...(options.nuxtStyleHeaders
              ? {}
              : {
                  link: `<${origin}${url.pathname}>; rel="canonical"`,
                  "content-location": `${url.pathname === "/" ? "/index" : url.pathname}.md`,
                }),
          });
          response.end(MARKDOWN);
          return;
        }
        response.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          ...(options.nuxtStyleHeaders
            ? {
                vary: "Accept, Sec-Fetch-Dest",
                link: `<${origin}${url.pathname === "/" ? "/index.md" : `${url.pathname}.md`}>; rel="alternate"; type="text/markdown"`,
              }
            : {}),
        });
        response.end(HTML.replaceAll("__ORIGIN__", origin));
        return;
      }

      if (url.pathname === "/index.md" || url.pathname === "/guide.md") {
        response.writeHead(200, { "content-type": "text/markdown; charset=utf-8" });
        response.end(MARKDOWN);
        return;
      }

      if (
        url.pathname === "/ai-ready-audit-missing-page-9f8e7d6c" &&
        options.agentMissingFallback !== false &&
        request.headers.accept?.includes("text/markdown")
      ) {
        response.writeHead(200, {
          "content-type": "text/markdown; charset=utf-8",
          vary: options.nuxtStyleHeaders ? "Accept, Sec-Fetch-Dest" : "Accept",
          "x-robots-tag": "noindex",
        });
        response.end(options.emptyAgentMissingFallback ? "# Page not found\n" : "# Page not found\n\nTry the [sitemap](/sitemap.md).\n");
        return;
      }

      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      servers.push(server);
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Fixture server did not receive a TCP address"));
        return;
      }
      resolve({ server, target: `http://127.0.0.1:${address.port}/` });
    });
  });
}

async function closeServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

afterEach(async () => {
  const openServers = servers;
  servers = [];
  await Promise.all(openServers.map(closeServer));
});

describe("runAudit()", () => {
  it("audits a complete site and checks discovery, content, negotiation, and 404 behavior", async () => {
    const { target } = await startFixtureServer();
    const result = await runAudit(target, { timeoutMs: 2_000 });

    expect(result.version).toBe("1");
    expect(result.target).toBe(target);
    expect(result.pageUrl).toBe(target);
    expect(result.passed).toBe(16);
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.score).toBe(100);

    const checks = new Map(result.checks.map((check) => [check.id, check]));
    for (const id of [
      "html-response",
      "llms-txt",
      "sitemap-xml",
      "sitemap-md",
      "robots-txt",
      "accept-markdown",
      "agent-user-agent",
      "explicit-markdown",
      "markdown-headers",
      "markdown-frontmatter",
      "html-canonical",
      "meta-description",
      "json-ld",
      "page-h1",
      "real-404",
      "agent-markdown-404",
    ]) {
      expect(checks.get(id), `missing check: ${id}`).toMatchObject({
        id,
        status: "pass",
        message: expect.any(String),
        url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:/),
      });
    }
  });

  it("recognizes Nuxt-style alternate metadata while warning about unsafe user-agent caching", async () => {
    const { target } = await startFixtureServer({ nuxtStyleHeaders: true });
    const result = await runAudit(target, { timeoutMs: 2_000 });
    const checks = new Map(result.checks.map((check) => [check.id, check]));

    expect(checks.get("markdown-headers")).toMatchObject({
      status: "warn",
      message: expect.stringContaining("Vary: User-Agent"),
    });
    expect(checks.get("real-404")).toMatchObject({ status: "pass" });
    expect(checks.get("agent-markdown-404")).toMatchObject({ status: "pass" });
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(1);
    expect(result.score).toBeLessThan(100);
  });

  it("reports agent Markdown recovery independently from a correct HTML 404", async () => {
    const { target } = await startFixtureServer({ agentMissingFallback: false });
    const result = await runAudit(target, { timeoutMs: 2_000 });
    const checks = new Map(result.checks.map((check) => [check.id, check]));

    expect(checks.get("real-404")).toMatchObject({ status: "pass" });
    expect(checks.get("agent-markdown-404")).toMatchObject({ status: "warn" });
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(1);
    expect(result.score).toBe(100);
  });

  it("rejects a non-actionable Markdown missing-page response", async () => {
    const { target } = await startFixtureServer({ emptyAgentMissingFallback: true });
    const result = await runAudit(target, { timeoutMs: 2_000 });
    const check = result.checks.find((item) => item.id === "agent-markdown-404");

    expect(check).toMatchObject({ status: "warn" });
    expect(check?.message).toContain("recovery Markdown with noindex");
  });

  it("does not mistake a recovery document for the requested page", async () => {
    const recovery = `---\ndocument_status: not_found\nrecovery: true\n---\n\n# Page not found\n\n- [Sitemap](/sitemap.md)\n`;
    const response = new Response(recovery, {
      status: 200,
      headers: { "content-type": "text/markdown; charset=utf-8", "x-robots-tag": "noindex" },
    });
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/" || url.pathname === "/index.md") return response.clone();
      return new Response("Not found", { status: 404, headers: { "content-type": "text/html" } });
    };

    const result = await runAudit("https://example.test/", { fetch: fetchImpl });
    const checks = new Map(result.checks.map((check) => [check.id, check]));
    expect(checks.get("accept-markdown")).toMatchObject({ status: "fail" });
    expect(checks.get("explicit-markdown")).toMatchObject({ status: "warn" });
  });

  it("rejects an invalid URL with an actionable structured error", async () => {
    await expect(runAudit("not-a-url", { timeoutMs: 250 })).rejects.toMatchObject({
      name: "AiReadyError",
      code: "invalid_audit_url",
    });
  });
});
