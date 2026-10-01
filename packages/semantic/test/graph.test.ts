import { describe, expect, it } from "vitest";
import type { SemanticNode } from "@next-ai-ready/core";
import { buildGraph, getPageNodes } from "../src/graph.js";
import { pageJsonLd, siteJsonLd } from "../src/jsonld.js";

const SITE = {
  name: "Acme",
  baseUrl: "https://acme.com",
  description: "AI-ready website framework",
  organization: { name: "Acme Inc", url: "https://acme.com" },
};

// Inline mock data — avoids importing @next-ai-ready/mdx (which would create
// a cyclic dependency: mdx → semantic → mdx).

function makeInstallPage(): { page: SemanticNode; children: SemanticNode[] } {
  const section: SemanticNode = {
    id: "sec_prereqs",
    route: "/docs/install",
    kind: "section",
    title: "Prerequisites",
    citeUrl: "https://acme.com/docs/install#prerequisites",
    source: { file: "content/docs/install.mdx" },
  };
  const faq: SemanticNode = {
    id: "faq_runtime",
    route: "/docs/install",
    kind: "faq",
    title: "What runtime is required?",
    body: "Node 20 or higher.",
    citeUrl: "https://acme.com/docs/install#what-runtime-is-required",
    source: { file: "content/docs/install.mdx" },
  };
  const chunk: SemanticNode = {
    id: "chunk_0",
    route: "/docs/install",
    kind: "chunk",
    title: "Install Acme",
    body: "Run `pnpm i acme` to get started.",
    citeUrl: "https://acme.com/docs/install",
    embeddingHint: "Install Acme\n\nRun `pnpm i acme` to get started.",
    source: { file: "content/docs/install.mdx" },
  };
  const page: SemanticNode = {
    id: "page_install",
    route: "/docs/install",
    kind: "page",
    title: "Install Acme",
    summary: "Install Acme in under 60 seconds.",
    topics: ["install", "quickstart"],
    questions: [{ q: "What runtime is required?", a: "Node 20 or higher." }],
    body: "# Install Acme\n\nRun `pnpm i acme` to get started.",
    citeUrl: "https://acme.com/docs/install",
    updatedAt: "2026-05-01",
    author: { name: "Jane Doe", url: "https://acme.com/team/jane" },
    embeddingHint: "Install Acme\n\nInstall Acme in under 60 seconds.",
    children: [section.id, faq.id, chunk.id],
    source: { file: "content/docs/install.mdx" },
  };
  return { page, children: [section, faq, chunk] };
}

function makeHomePage(): { page: SemanticNode; children: SemanticNode[] } {
  const page: SemanticNode = {
    id: "page_home",
    route: "/",
    kind: "page",
    title: "Welcome",
    body: "# Welcome\n\nHello world.",
    citeUrl: "https://acme.com",
    embeddingHint: "Welcome",
    children: [],
    source: { file: "content/index.mdx" },
  };
  return { page, children: [] };
}

describe("buildGraph()", () => {
  it("assembles pages into a flat node store keyed by id", () => {
    const a = makeInstallPage();
    const b = makeHomePage();
    const graph = buildGraph({ site: SITE, pages: [a, b], generatedAt: "2026-01-01T00:00:00Z" });

    expect(graph.routes["/"]).toBe(b.page.id);
    expect(graph.routes["/docs/install"]).toBe(a.page.id);
    expect(graph.nodes[a.page.id]).toBe(a.page);
    // All children present.
    for (const child of a.children) expect(graph.nodes[child.id]).toBe(child);
    expect(graph.generatedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("getPageNodes collects nested descendants", () => {
    const grandchild: SemanticNode = {
      id: "gc",
      route: "/nested",
      kind: "chunk",
      source: { file: "f.mdx" },
    };
    const child: SemanticNode = {
      id: "c",
      route: "/nested",
      kind: "section",
      source: { file: "f.mdx" },
      children: ["gc"],
    };
    const page: SemanticNode = {
      id: "p",
      route: "/nested",
      kind: "page",
      source: { file: "f.mdx" },
      children: ["c"],
    };
    const graph = buildGraph({
      site: SITE,
      pages: [{ page, children: [child, grandchild] }],
      generatedAt: "x",
    });
    expect(getPageNodes(graph, "/nested").map((n) => n.id)).toEqual(["p", "c", "gc"]);
  });

  it("getPageNodes returns page + descendants", () => {
    const a = makeInstallPage();
    const graph = buildGraph({ site: SITE, pages: [a], generatedAt: "x" });
    const nodes = getPageNodes(graph, "/docs/install");
    expect(nodes[0]).toBe(a.page);
    expect(nodes.length).toBe(1 + a.children.length);
  });
});

describe("pageJsonLd()", () => {
  function breadcrumbItems(graph: ReturnType<typeof buildGraph>, route: string) {
    const breadcrumb = pageJsonLd(graph, route).find((block) => block["@type"] === "BreadcrumbList");
    return breadcrumb?.itemListElement as Array<{ name: string; item: string; position: number }> | undefined;
  }

  it("emits WebPage + Article + FAQPage + BreadcrumbList for a rich page", () => {
    const a = makeInstallPage();
    const graph = buildGraph({ site: SITE, pages: [a], generatedAt: "x" });
    const blocks = pageJsonLd(graph, "/docs/install");
    const types = blocks.map((b) => b["@type"]);
    expect(types).toContain("WebPage");
    expect(types).toContain("Article");
    expect(types).toContain("FAQPage");
    expect(types).toContain("BreadcrumbList");

    const article = blocks.find((b) => b["@type"] === "Article") as Record<string, unknown>;
    expect(article.headline).toBe("Install Acme");
    expect((article.author as Record<string, unknown>).name).toBe("Jane Doe");
    expect(article.publisher).toBeDefined();
  });

  it("omits Article and BreadcrumbList for root pages without author", () => {
    const b = makeHomePage();
    const graph = buildGraph({ site: SITE, pages: [b], generatedAt: "x" });
    const blocks = pageJsonLd(graph, "/");
    const types = blocks.map((b) => b["@type"]);
    expect(types).toContain("WebPage");
    expect(types).not.toContain("Article");
    expect(types).not.toContain("BreadcrumbList");
  });

  it("skips nonexistent directories and keeps consecutive breadcrumb positions", () => {
    const graph = buildGraph({ site: SITE, pages: [makeInstallPage()], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install")).toEqual([
      { "@type": "ListItem", position: 1, name: "Acme", item: "https://acme.com" },
      { "@type": "ListItem", position: 2, name: "Install Acme", item: "https://acme.com/docs/install" },
    ]);
  });

  it("uses real ancestor titles and their canonical URLs", () => {
    const home = makeHomePage();
    home.page.citeUrl = "https://acme.com/welcome";
    const docs = makeHomePage();
    docs.page = { ...docs.page, id: "page_docs", route: "/docs", title: "Documentation", citeUrl: "https://acme.com/documentation" };
    const graph = buildGraph({ site: SITE, pages: [home, docs, makeInstallPage()], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install")?.map(({ name, item }) => ({ name, item }))).toEqual([
      { name: "Welcome", item: "https://acme.com/welcome" },
      { name: "Documentation", item: "https://acme.com/documentation" },
      { name: "Install Acme", item: "https://acme.com/docs/install" },
    ]);
  });

  it("includes a localized homepage without inventing intermediate locale directories", () => {
    const home = makeHomePage();
    home.page = { ...home.page, route: "/zh", title: "首页", citeUrl: "https://acme.com/zh" };
    const install = makeInstallPage();
    install.page = { ...install.page, route: "/zh/docs/guides/install", title: "安装指南", citeUrl: "https://acme.com/zh/docs/guides/install" };
    const graph = buildGraph({ site: SITE, pages: [home, install], generatedAt: "x" });
    expect(breadcrumbItems(graph, install.page.route!)?.map(({ name, item }) => ({ name, item }))).toEqual([
      { name: "Acme", item: "https://acme.com" },
      { name: "首页", item: "https://acme.com/zh" },
      { name: "安装指南", item: "https://acme.com/zh/docs/guides/install" },
    ]);
  });

  it("normalizes trailing slashes in the base URL and preserves a base path", () => {
    const page = makeInstallPage();
    page.page.citeUrl = undefined;
    const graph = buildGraph({ site: { ...SITE, baseUrl: "https://acme.com/product/" }, pages: [page], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install")?.map(({ item }) => item)).toEqual([
      "https://acme.com/product",
      "https://acme.com/product/docs/install",
    ]);
  });

  it("keeps the actual leaf when its route has a trailing slash", () => {
    const page = makeInstallPage();
    page.page.route = "/docs/install/";
    const graph = buildGraph({ site: SITE, pages: [page], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install/")?.at(-1)?.name).toBe("Install Acme");
  });

  it("ignores missing nodes and non-page ancestors", () => {
    const graph = buildGraph({ site: SITE, pages: [makeInstallPage()], generatedAt: "x" });
    graph.routes["/docs"] = "missing";
    expect(breadcrumbItems(graph, "/docs/install")).toHaveLength(2);
    graph.routes["/docs"] = "sec_prereqs";
    expect(breadcrumbItems(graph, "/docs/install")).toHaveLength(2);
  });

  it("omits duplicate canonical URLs and single-item breadcrumb trails", () => {
    const page = makeInstallPage();
    page.page.citeUrl = SITE.baseUrl;
    const graph = buildGraph({ site: SITE, pages: [page], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install")).toBeUndefined();
  });

  it("treats equivalent absolute URL spellings as the same canonical target", () => {
    const page = makeInstallPage();
    page.page.citeUrl = "https://ACME.com:443/";
    const graph = buildGraph({ site: SITE, pages: [page], generatedAt: "x" });
    expect(breadcrumbItems(graph, "/docs/install")).toBeUndefined();
  });

  it("returns no JSON-LD for unknown routes", () => {
    const graph = buildGraph({ site: SITE, pages: [makeHomePage()], generatedAt: "x" });
    expect(pageJsonLd(graph, "/missing")).toEqual([]);
  });
});

describe("siteJsonLd()", () => {
  it("emits WebSite + Organization when site declares an organization", () => {
    const blocks = siteJsonLd(SITE);
    const types = blocks.map((b) => b["@type"]);
    expect(types).toEqual(["WebSite", "Organization"]);
  });
});
