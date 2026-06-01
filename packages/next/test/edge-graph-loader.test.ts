import { describe, expect, it, vi, afterEach } from "vitest";
import { loadGraphFromFetch, invalidateEdgeGraphCache } from "../src/runtime/edge-graph-loader.js";

describe("edge graph loader (P6-04)", () => {
  afterEach(() => {
    invalidateEdgeGraphCache();
    vi.restoreAllMocks();
  });

  it("loads graph JSON over fetch", async () => {
    const graph = { routes: {}, nodes: {}, site: { name: "X", baseUrl: "https://x.com" }, generatedAt: "t" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(graph), { status: 200 })),
    );
    await expect(loadGraphFromFetch("https://x.com/graph.json")).resolves.toEqual(graph);
  });
});
