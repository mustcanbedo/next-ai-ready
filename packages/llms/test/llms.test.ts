import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compile } from "@next-ai-ready/mdx";
import { buildGraph } from "@next-ai-ready/semantic";
import { fileToRoute } from "@next-ai-ready/core";
import { renderLlmsTxt } from "../src/llms-txt.js";
import { renderLlmsFullTxt } from "../src/llms-full-txt.js";
import { renderPageMarkdown, renderPageMarkdownRecovery } from "../src/page-md.js";
import { renderPageAiJson } from "../src/page-ai-json.js";
import { renderSitemapMarkdown } from "../src/sitemap-md.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, "..", "..", "mdx", "test", "fixtures");

const SITE = {
  name: "Acme",
  baseUrl: "https://acme.com",
  description: "AI-ready website framework",
};

async function makeGraph() {
  const files = ["content/index.mdx", "content/docs/install.mdx"];
  const pages = await Promise.all(
    files.map(async (rel) => {
      const abs = join(fixturesRoot, rel);
      const source = await readFile(abs, "utf8");
      return compile({ source, route: fileToRoute(rel), file: abs, site: SITE });
    }),
  );
  return buildGraph({ site: SITE, pages, generatedAt: "2026-05-28T00:00:00Z" });
}

describe("renderLlmsTxt()", () => {
  it("zero-config produces a single Pages section listing every route", async () => {
    const graph = await makeGraph();
    const out = renderLlmsTxt(graph);
    expect(out).toMatchSnapshot();
    expect(out.startsWith("# Acme")).toBe(true);
    expect(out).toContain("> AI-ready website framework");
    expect(out).toContain("## Pages");
    expect(out).toContain("[Welcome](https://acme.com)");
    expect(out).toContain("[Install Acme](https://acme.com/docs/install): Install Acme in under 60 seconds.");
  });

  it("derives freshness from page metadata instead of the build timestamp", async () => {
    const graph = await makeGraph();
    graph.generatedAt = "2099-12-31T23:59:59Z";

    const out = renderLlmsTxt(graph);

    expect(out).toContain("<!-- Last updated: 2026-05-01 -->");
    expect(out).not.toContain("2099-12-31");
  });

  it("omits freshness when pages do not declare updatedAt", async () => {
    const graph = await makeGraph();
    for (const routeId of Object.values(graph.routes)) {
      delete graph.nodes[routeId]?.updatedAt;
    }

    expect(renderLlmsTxt(graph)).not.toContain("Last updated:");
  });

  it("respects custom sections + glob + priority + limit", async () => {
    const graph = await makeGraph();
    const out = renderLlmsTxt(graph, {
      llms: {
        sections: [
          { title: "Guides", include: "/docs/**", priority: "high" },
          { title: "Home", include: "/", limit: 1 },
        ],
      },
    });
    // High-priority section first.
    const guidesIdx = out.indexOf("## Guides");
    const homeIdx = out.indexOf("## Home");
    expect(guidesIdx).toBeGreaterThan(-1);
    expect(homeIdx).toBeGreaterThan(guidesIdx);
    expect(out).toContain("[Install Acme](https://acme.com/docs/install)");
    expect(out).toContain("[Welcome](https://acme.com)");
  });

  it("respects exclude glob", async () => {
    const graph = await makeGraph();
    const out = renderLlmsTxt(graph, { llms: { exclude: ["/docs/**"] } });
    expect(out).not.toContain("Install Acme");
    expect(out).toContain("Welcome");
  });
});

describe("renderLlmsFullTxt()", () => {
  it("dumps every page body between stable BEGIN/END markers in route order", async () => {
    const graph = await makeGraph();
    const out = renderLlmsFullTxt(graph);
    const beginIdx = out.indexOf("<!-- BEGIN / -->");
    const installIdx = out.indexOf("<!-- BEGIN /docs/install -->");
    expect(beginIdx).toBeGreaterThan(-1);
    expect(installIdx).toBeGreaterThan(beginIdx); // '/' sorts before '/docs/...'
    expect(out).toContain("URL: https://acme.com/docs/install");
    expect(out).toContain("## FAQ");
    expect(out).toContain("What runtime is required?");
  });
});

describe("renderSitemapMarkdown()", () => {
  it("lists canonical page URLs in stable route order", async () => {
    const graph = await makeGraph();
    const out = renderSitemapMarkdown(graph);
    expect(out).toContain("# Acme Sitemap");
    expect(out).toContain("[Welcome](https://acme.com)");
    expect(out).toContain("[Install Acme](https://acme.com/docs/install)");
    expect(out.indexOf("[Welcome]")).toBeLessThan(out.indexOf("[Install Acme]"));
  });
});

describe("renderPageMarkdown()", () => {
  it("emits a YAML-style header + body", async () => {
    const graph = await makeGraph();
    const md = renderPageMarkdown(graph, "/docs/install");
    expect(md).not.toBeNull();
    const text = md!;
    expect(text.startsWith("---\n")).toBe(true);
    expect(text).toContain("title: Install Acme");
    expect(text).toContain("description: Install Acme in under 60 seconds.");
    expect(text).toContain("canonical_url: https://acme.com/docs/install");
    expect(text).toContain("url: https://acme.com/docs/install");
    expect(text).toContain("last_updated: 2026-05-01");
    expect(text).toContain("updated: 2026-05-01");
    expect(text).toContain("# Install Acme");
  });

  it("returns null for unknown routes", async () => {
    const graph = await makeGraph();
    expect(renderPageMarkdown(graph, "/nope")).toBeNull();
  });
});

describe("renderPageMarkdownRecovery()", () => {
  it("emits machine-readable recovery metadata and discovery links", async () => {
    const graph = await makeGraph();
    const md = renderPageMarkdownRecovery(graph, {
      requestedRoute: "/docs/instal",
      requestedPath: "/docs/instal.md",
    });

    expect(md).toContain('document_status: "not_found"');
    expect(md).toContain("recovery: true");
    expect(md).toContain('requested_path: "/docs/instal.md"');
    expect(md).toContain('requested_route: "/docs/instal"');
    expect(md).toContain('llms_txt: "https://acme.com/llms.txt"');
    expect(md).toContain('sitemap_md: "https://acme.com/sitemap.md"');
    expect(md).toContain("[Install Acme](https://acme.com/docs/install)");
    expect(md).toContain("[LLM content index](https://acme.com/llms.txt)");
    expect(md).toContain("[Markdown sitemap](https://acme.com/sitemap.md)");
  });

  it("ranks typo-adjacent routes first and caps deterministic suggestions at five", async () => {
    const graph = await makeGraph();
    const templateId = graph.routes["/docs/install"];
    const template = graph.nodes[templateId];
    for (const route of ["/about", "/docs/api", "/docs/config", "/docs/deploy", "/pricing", "/support"]) {
      const id = `page:${route}`;
      graph.routes[route] = id;
      graph.nodes[id] = { ...template, id, route, title: route.slice(1) };
    }

    const first = renderPageMarkdownRecovery(graph, { requestedRoute: "/docs/instal", limit: 99 });
    const second = renderPageMarkdownRecovery(graph, { requestedRoute: "/docs/instal", limit: 99 });
    const suggestionLines = first
      .slice(first.indexOf("## Suggested pages"), first.indexOf("## Site discovery"))
      .split("\n")
      .filter((line) => line.startsWith("- ["));

    expect(first).toEqual(second);
    expect(suggestionLines).toHaveLength(5);
    expect(suggestionLines[0]).toContain("https://acme.com/docs/install");
  });

  it("sanitizes suggestion text and falls back from unsafe cite URLs", async () => {
    const graph = await makeGraph();
    const template = graph.nodes[graph.routes["/docs/install"]];
    const route = "/docs/danger";
    const id = `page:${route}`;
    graph.routes[route] = id;
    graph.nodes[id] = {
      ...template,
      id,
      route,
      title: "Danger](/escape)\n## Injected",
      summary: "Summary\n- ![tracking](javascript:alert(1))",
      citeUrl: "javascript:alert(1)\n## Injected",
    };

    const requestedPath = "/docs/missing.md`\n## Requested path injection";
    const md = renderPageMarkdownRecovery(graph, {
      requestedRoute: route,
      requestedPath,
      limit: 1,
    });
    const suggestion = md.split("\n").find((line) => line.startsWith("- ["));

    expect(md).toContain(`requested_path: ${JSON.stringify(requestedPath)}`);
    expect(md).not.toContain("\n## Requested path injection");
    expect(md).not.toContain("](javascript:");
    expect(suggestion).toContain("(https://acme.com/docs/danger)");
    expect(suggestion).not.toContain("](/escape)");
    expect(suggestion).not.toContain("\n");
  });

  it("bounds similarity work for very long requests and routes", async () => {
    const graph = await makeGraph();
    const template = graph.nodes[graph.routes["/docs/install"]];
    const longRoute = `/docs/${"x".repeat(20_000)}`;
    const id = "page:long-route";
    graph.routes[longRoute] = id;
    graph.nodes[id] = {
      ...template,
      id,
      route: longRoute,
      title: "Long route",
      summary: "Bounded candidate",
      citeUrl: "https://acme.com/docs/long-route",
    };

    const md = renderPageMarkdownRecovery(graph, {
      requestedRoute: `${longRoute}tail`,
      requestedPath: `${longRoute}.md`,
      limit: 1,
    });

    expect(md).toContain("[Long route](https://acme.com/docs/long-route)");
    expect(md.length).toBeLessThan(10_000);

    delete graph.nodes[id].citeUrl;
    const withoutSafeCite = renderPageMarkdownRecovery(graph, {
      requestedRoute: longRoute,
      requestedPath: `${longRoute}.md`,
      limit: 1,
    });
    expect(withoutSafeCite).not.toContain("[Long route]");
    expect(withoutSafeCite.length).toBeLessThan(10_000);
  });

  it("uses Unicode NFKC normalization when ranking routes", async () => {
    const graph = await makeGraph();
    const template = graph.nodes[graph.routes["/docs/install"]];
    const routes = [
      { route: "/docs/ﬁle", title: "Compatibility file", citeUrl: "https://acme.com/docs/file" },
      { route: "/docs/filer", title: "Other file", citeUrl: "https://acme.com/docs/filer" },
    ];
    for (const candidate of routes) {
      const id = `page:${candidate.route}`;
      graph.routes[candidate.route] = id;
      graph.nodes[id] = { ...template, id, ...candidate };
    }

    const compatibility = renderPageMarkdownRecovery(graph, { requestedRoute: "/docs/file", limit: 1 });
    expect(compatibility).toContain("[Compatibility file](https://acme.com/docs/file)");

    const composedRoute = "/docs/café";
    const composedId = `page:${composedRoute}`;
    graph.routes[composedRoute] = composedId;
    graph.nodes[composedId] = {
      ...template,
      id: composedId,
      route: composedRoute,
      title: "Composed cafe",
      citeUrl: "https://acme.com/docs/cafe",
    };
    const canonical = renderPageMarkdownRecovery(graph, { requestedRoute: "/docs/cafe\u0301", limit: 1 });
    expect(canonical).toContain("[Composed cafe](https://acme.com/docs/cafe)");
  });
});

describe("renderPageAiJson()", () => {
  it("returns the page node plus all descendants", async () => {
    const graph = await makeGraph();
    const data = renderPageAiJson(graph, "/docs/install");
    expect(data).not.toBeNull();
    expect(data!.page.route).toBe("/docs/install");
    expect(data!.children.length).toBeGreaterThan(0);
    // Every child id must appear in the page's children array.
    const ids = new Set(data!.page.children ?? []);
    for (const c of data!.children) expect(ids.has(c.id)).toBe(true);
  });
});
