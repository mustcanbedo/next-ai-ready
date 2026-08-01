import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction, defineActions, clearRegistry } from "@next-ai-ready/actions";
import type { SemanticGraph } from "@next-ai-ready/core";
import { toMcpPageToolDefinitions, toMcpToolDefinitions } from "../src/tools.js";
import { toMcpResourceDefinitions, readMcpResource } from "../src/resources.js";
import { registerAiReady, type McpServerLike } from "../src/server.js";

beforeEach(() => clearRegistry());

function seedActions() {
  defineActions([
    defineAction({
      name: "search",
      description: "Search the catalogue.",
      whenToUse: "When the user looks for a product.",
      whenNotToUse: "For order status.",
      public: true,
      input: z.object({ query: z.string().min(1) }),
      output: z.object({ items: z.array(z.string()) }),
      handler: async ({ query }) => ({ items: [query] }),
    }),
    defineAction({
      name: "secret",
      description: "Internal only.",
      whenToUse: "Never.",
      public: false,
      input: z.object({}),
      handler: async () => ({}),
    }),
  ]);
}

const GRAPH: SemanticGraph = {
  site: { name: "Acme", baseUrl: "https://acme.com" },
  generatedAt: "2026-01-01T00:00:00.000Z",
  routes: { "/": "n_home", "/docs/install": "n_install" },
  nodes: {
    n_home: {
      id: "n_home",
      route: "/",
      kind: "page",
      title: "Home",
      summary: "Welcome.",
      body: "# Home\n\nWelcome.",
      citeUrl: "https://acme.com",
      source: { file: "app/page.mdx" },
    },
    n_install: {
      id: "n_install",
      route: "/docs/install",
      kind: "page",
      title: "Install",
      summary: "How to install.",
      body: "# Install\n\nRun npm i.",
      citeUrl: "https://acme.com/docs/install",
      source: { file: "content/install.mdx" },
    },
  },
};

describe("toMcpToolDefinitions()", () => {
  it("exposes only public actions with folded descriptions + schemas", () => {
    seedActions();
    const tools = toMcpToolDefinitions();
    expect(tools.map((t) => t.name)).toEqual(["search"]);
    const t = tools[0];
    expect(t.description).toContain("Search the catalogue.");
    expect(t.description).toContain("Use when:");
    expect(t.description).toContain("Do not use when:");
    expect(t.inputSchema).toMatchObject({ type: "object", properties: { query: { type: "string" } } });
    expect(Object.keys(t.inputShape)).toContain("query");
  });

  it("executor delegates to invokeAction (success + validation error envelopes)", async () => {
    seedActions();
    const [search] = toMcpToolDefinitions();

    const ok = await search.execute({ query: "shoes" });
    expect(ok.isError).toBeUndefined();
    expect(JSON.parse(ok.content[0].text)).toEqual({ items: ["shoes"] });

    const bad = await search.execute({ query: "" });
    expect(bad.isError).toBe(true);
    expect(JSON.parse(bad.content[0].text).error).toBe("invalid_input");
  });
});

describe("resources", () => {
  it("lists pages as sorted airead:// resources", () => {
    const res = toMcpResourceDefinitions(GRAPH);
    // Sorted by route: "/" precedes "/docs/install".
    expect(res.map((r) => r.uri)).toEqual(["airead://page/index", "airead://page/docs/install"]);
    expect(res[0].name).toBe("Home");
    expect(res[0].read().text).toContain("# Home");
  });

  it("reads a resource back by URI, mapping /index → /", () => {
    expect(readMcpResource(GRAPH, "airead://page/index")?.text).toContain("title: Home");
    expect(readMcpResource(GRAPH, "airead://page/docs/install")?.text).toContain("Install");
    expect(readMcpResource(GRAPH, "airead://page/missing")).toBeNull();
    expect(readMcpResource(GRAPH, "http://other")).toBeNull();
  });
});

describe("page discovery tools", () => {
  it("lists pages deterministically with bounded cursor pagination", async () => {
    const [list] = toMcpPageToolDefinitions(GRAPH);
    const first = JSON.parse((await list.execute({ limit: 1 })).content[0].text);
    expect(first).toMatchObject({
      pages: [{ route: "/", uri: "airead://page/index", title: "Home", url: "https://acme.com/" }],
      nextCursor: "/",
      total: 2,
    });

    const second = JSON.parse((await list.execute({ cursor: first.nextCursor, limit: 1 })).content[0].text);
    expect(second.pages.map((page: { route: string }) => page.route)).toEqual(["/docs/install"]);
    expect(second.nextCursor).toBeNull();
    expect((await list.execute({ limit: 51 })).isError).toBe(true);
    expect((await list.execute({ cursor: "/../secret" })).isError).toBe(true);
  });

  it("gets full page Markdown and rejects unknown or unsafe routes", async () => {
    const [, get] = toMcpPageToolDefinitions(GRAPH);
    const result = JSON.parse((await get.execute({ route: "/docs/install" })).content[0].text);
    expect(result).toMatchObject({ route: "/docs/install", title: "Install" });
    expect(result.markdown).toContain("Run npm i.");
    expect((await get.execute({ route: "/missing" })).isError).toBe(true);
    expect((await get.execute({ route: "/docs/%2e%2e/secret" })).isError).toBe(true);
  });

  it("searches locally with deterministic scoring, normalization, and result caps", async () => {
    const [, , search] = toMcpPageToolDefinitions(GRAPH);
    const first = await search.execute({ query: "ＩＮＳＴＡＬＬ", limit: 1 });
    const second = await search.execute({ query: "ＩＮＳＴＡＬＬ", limit: 1 });
    expect(first).toEqual(second);
    const result = JSON.parse(first.content[0].text);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({ route: "/docs/install", title: "Install" });
    expect(result.results[0].score).toBeGreaterThan(0);
    expect((await search.execute({ query: "---" })).isError).toBe(true);
    expect((await search.execute({ query: "x", limit: 21 })).isError).toBe(true);
    expect((await search.execute({ query: "x".repeat(201) })).isError).toBe(true);
  });

  it("keeps only top-k search results while reporting every match", async () => {
    const graph: SemanticGraph = {
      ...GRAPH,
      routes: {},
      nodes: {},
    };
    for (let index = 0; index < 25; index += 1) {
      const route = `/guide/${String(index).padStart(2, "0")}`;
      const id = `n_${index}`;
      graph.routes[route] = id;
      graph.nodes[id] = {
        id,
        route,
        kind: "page",
        title: `Guide ${index}`,
        summary: "Shared discovery term",
        source: { file: `guide/${index}.md` },
      };
    }

    const [, , search] = toMcpPageToolDefinitions(graph);
    const result = JSON.parse((await search.execute({ query: "discovery", limit: 20 })).content[0].text);
    expect(result.results).toHaveLength(20);
    expect(result.totalMatches).toBe(25);
    expect(result.results.map((page: { route: string }) => page.route)).toEqual(
      Array.from({ length: 20 }, (_, index) => `/guide/${String(index).padStart(2, "0")}`),
    );
  });
});

describe("registerAiReady()", () => {
  it("registers public tools and graph resources onto a server-like object", () => {
    seedActions();
    const toolCalls: string[] = [];
    const resourceCalls: string[] = [];
    const server: McpServerLike = {
      tool: (name) => {
        toolCalls.push(name);
      },
      resource: (name) => {
        resourceCalls.push(name);
      },
    };

    const counts = registerAiReady(server, { graph: GRAPH });
    expect(counts.tools).toBe(4);
    expect(counts.resources).toBe(2);
    expect(toolCalls).toEqual(["search", "list_pages", "get_page", "search_pages"]);
    expect(resourceCalls).toEqual(["Home", "Install"]);
  });

  it("respects includeTool filter and skips resources without graph", () => {
    seedActions();
    const server: McpServerLike = { tool: () => {} };
    const counts = registerAiReady(server, { includeTool: () => false });
    expect(counts.tools).toBe(0);
    expect(counts.resources).toBe(0);
  });

  it("keeps a user action when its name collides with a page discovery tool", () => {
    defineAction({
      name: "list_pages",
      description: "A user-defined page list.",
      public: true,
      input: z.object({}),
      handler: async () => ({ source: "user" }),
    });
    const toolCalls: string[] = [];
    const server: McpServerLike = { tool: (name) => toolCalls.push(name), resource: () => {} };

    const counts = registerAiReady(server, { graph: GRAPH });
    expect(toolCalls.filter((name) => name === "list_pages")).toHaveLength(1);
    expect(counts.tools).toBe(3);
  });
});
