import { defineActions, defineAction } from "@next-ai-ready/actions";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Demo actions for the docs-site — dogfoods the Capability plane.
 *
 * Exposed at:
 *   POST /api/actions/search_docs
 *   POST /api/actions/get_page_content
 *   POST /api/actions/list_api_methods
 *
 * Also surfaced in /openapi.json + /tools.json for agent discovery.
 */

/** Load the SemanticGraph from the build output. */
async function loadGraph() {
  const graphPath = join(process.cwd(), ".next-ai-ready", "graph.json");
  const raw = await readFile(graphPath, "utf8");
  return JSON.parse(raw);
}

export default defineActions([
  defineAction({
    name: "search_docs",
    description: "Search documentation pages by keyword. Returns matching pages with title, summary, and route.",
    whenToUse: "When the user asks about a topic and you need to find relevant documentation pages.",
    whenNotToUse: "When the user asks for the full content of a specific page (use get_page_content instead).",
    public: true,
    tags: ["docs", "search"],
    input: z.object({
      query: z.string().min(1).describe("Search keyword or phrase"),
      limit: z.number().int().min(1).max(20).optional().describe("Max results to return (default 5)"),
    }),
    output: z.object({
      results: z.array(
        z.object({
          route: z.string(),
          title: z.string(),
          summary: z.string(),
          section: z.string(),
        }),
      ),
      total: z.number(),
    }),
    handler: async ({ query, limit }) => {
      const graph = await loadGraph();
      const q = query.toLowerCase();
      const matches = [];

      for (const [route, nodeId] of Object.entries(graph.routes)) {
        const node = graph.nodes[nodeId];
        if (!node) continue;
        const title = (node.title ?? "").toLowerCase();
        const summary = (node.summary ?? "").toLowerCase();
        const body = (node.body ?? "").toLowerCase();
        if (title.includes(q) || summary.includes(q) || body.includes(q)) {
          const section = route.split("/").filter(Boolean).length > 1 ? route.split("/").filter(Boolean)[1] : "root";
          matches.push({
            route,
            title: node.title ?? route,
            summary: node.summary ?? "",
            section,
          });
        }
      }

      const capped = matches.slice(0, limit ?? 5);
      return { results: capped, total: matches.length };
    },
  }),

  defineAction({
    name: "get_page_content",
    description: "Get the markdown content of a documentation page by its route.",
    whenToUse: "When you know which page the user needs and want to read its full content.",
    whenNotToUse: "When you need to search for pages first (use search_docs instead).",
    public: true,
    tags: ["docs", "content"],
    input: z.object({
      route: z.string().min(1).describe("Page route, e.g. '/en/introduction' or '/zh/guides/quickstart'"),
    }),
    output: z.object({
      route: z.string(),
      title: z.string(),
      summary: z.string(),
      content: z.string(),
      found: z.boolean(),
    }),
    handler: async ({ route }) => {
      const graph = await loadGraph();
      const nodeId = graph.routes[route];
      if (!nodeId) {
        return { route, title: "", summary: "", content: "", found: false };
      }
      const node = graph.nodes[nodeId];
      return {
        route,
        title: node.title ?? route,
        summary: node.summary ?? "",
        content: node.body ?? "",
        found: true,
      };
    },
  }),

  defineAction({
    name: "list_api_methods",
    description: "List all available API methods (actions) with their names and descriptions.",
    whenToUse: "When you need to discover what tools are available before calling them.",
    whenNotToUse: "When you already know which action to call.",
    public: true,
    tags: ["api", "discovery"],
    input: z.object({}),
    output: z.object({
      methods: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          tags: z.array(z.string()),
        }),
      ),
    }),
    handler: async () => {
      // Return the three demo actions as discoverable methods.
      return {
        methods: [
          { name: "search_docs", description: "Search documentation pages by keyword.", tags: ["docs", "search"] },
          { name: "get_page_content", description: "Get the markdown content of a page by route.", tags: ["docs", "content"] },
          { name: "list_api_methods", description: "List all available API methods.", tags: ["api", "discovery"] },
        ],
      };
    },
  }),
]);
