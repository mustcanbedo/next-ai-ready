import { describe, expect, it } from "vitest";
import { buildGraph } from "../src/graph.js";

const SITE = { name: "Acme", baseUrl: "https://acme.com" };

describe("buildGraph locale index (P6-06)", () => {
  it("sets locale on nodes and builds routesByLocale", () => {
    const page = {
      id: "p1",
      route: "/en/about",
      kind: "page" as const,
      source: { file: "content/en/about.mdx" },
      children: [],
    };
    const graph = buildGraph({ site: SITE, pages: [{ page, children: [] }], generatedAt: "x" });
    expect(graph.nodes.p1.locale).toBe("en");
    expect(graph.routesByLocale?.en["/about"]).toBe("p1");
  });
});
