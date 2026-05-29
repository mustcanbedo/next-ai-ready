import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compile } from "@next-ai-ready/mdx";
import { buildGraph } from "@next-ai-ready/semantic";
import { fileToRoute } from "@next-ai-ready/core";
import { renderLlmsTxt } from "../src/llms-txt.js";
import { renderLlmsFullTxt } from "../src/llms-full-txt.js";
import { renderPageMarkdown } from "../src/page-md.js";
import { renderPageAiJson } from "../src/page-ai-json.js";

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
    expect(out.startsWith("# Acme")).toBe(true);
    expect(out).toContain("> AI-ready website framework");
    expect(out).toContain("## Pages");
    expect(out).toContain("[Welcome](https://acme.com)");
    expect(out).toContain("[Install Acme](https://acme.com/docs/install): Install Acme in under 60 seconds.");
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
    expect(text).toContain("url: https://acme.com/docs/install");
    expect(text).toContain("updated: 2026-05-01");
    expect(text).toContain("# Install Acme");
  });

  it("returns null for unknown routes", async () => {
    const graph = await makeGraph();
    expect(renderPageMarkdown(graph, "/nope")).toBeNull();
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
