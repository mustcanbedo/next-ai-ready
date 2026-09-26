import { describe, expect, it } from "vitest";
import type { SemanticGraph } from "@next-ai-ready/core";
import { createGraphSearchProvider, isSearchablePageQuery, searchGraphPages } from "../src/search.js";

const GRAPH: SemanticGraph = {
  site: { name: "next-ai-ready", baseUrl: "https://example.com" },
  generatedAt: "2026-01-01T00:00:00.000Z",
  routes: {
    "/en": "home",
    "/en/docs/install": "install_en",
    "/zh/docs/install": "install_zh",
    "/zh/docs/config": "config_zh",
  },
  nodes: {
    home: {
      id: "home",
      route: "/en",
      kind: "page",
      title: "next-ai-ready",
      summary: "Make Next.js sites readable by AI.",
      locale: "en",
      source: { file: "en/index.mdx" },
    },
    install_en: {
      id: "install_en",
      route: "/en/docs/install",
      kind: "page",
      title: "Installation",
      summary: "Install and initialize the package.",
      locale: "en",
      updatedAt: "2026-01-01",
      source: { file: "en/install.mdx" },
    },
    install_zh: {
      id: "install_zh",
      route: "/zh/docs/install",
      kind: "page",
      title: "安装",
      summary: "安装 next-ai-ready 并初始化配置。",
      locale: "zh",
      source: { file: "zh/install.mdx" },
    },
    config_zh: {
      id: "config_zh",
      route: "/zh/docs/config",
      kind: "page",
      title: "配置",
      summary: "配置内容目录和站点选项。",
      locale: "zh",
      source: { file: "zh/config.mdx" },
    },
  },
};

describe("graph page search", () => {
  it("ranks English and Chinese intent deterministically", () => {
    const install = searchGraphPages(GRAPH, { query: "installation", locale: "en" });
    const config = searchGraphPages(GRAPH, { query: "内容目录怎么配置", locale: "zh" });
    expect(install.results[0]).toMatchObject({
      route: "/en/docs/install",
      url: "https://example.com/en/docs/install",
      locale: "en",
    });
    expect(config.results[0]?.route).toBe("/zh/docs/config");
    expect(searchGraphPages(GRAPH, { query: "installation", locale: "en" })).toEqual(install);
  });

  it("bounds results while retaining total matches", () => {
    const response = searchGraphPages(GRAPH, { query: "next-ai-ready", limit: 1 });
    expect(response.results).toHaveLength(1);
    expect(response.totalMatches).toBeGreaterThan(1);
  });

  it("exposes a replaceable provider and validates searchable queries", async () => {
    const provider = createGraphSearchProvider(GRAPH);
    expect((await provider.search({ query: "怎么安装", locale: "zh" })).results[0]?.route)
      .toBe("/zh/docs/install");
    expect(isSearchablePageQuery("---")).toBe(false);
    expect(isSearchablePageQuery("install")).toBe(true);
  });
});
