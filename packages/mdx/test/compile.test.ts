import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compile } from "../src/compile.js";
import { fileToRoute } from "@next-ai-ready/core";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, "fixtures");

const SITE = {
  name: "Acme",
  baseUrl: "https://acme.com",
  organization: { name: "Acme Inc", url: "https://acme.com" },
};

async function compileFixture(relPath: string) {
  const abs = join(fixturesRoot, relPath);
  const source = await readFile(abs, "utf8");
  return compile({
    source,
    route: fileToRoute(relPath),
    file: abs,
    site: SITE,
  });
}

describe("compile()", () => {
  it("derives route, title, summary, updatedAt, author from frontmatter", async () => {
    const { page } = await compileFixture("content/docs/install.mdx");
    expect(page.route).toBe("/docs/install");
    expect(page.title).toBe("Install Acme");
    expect(page.summary).toBe("Install Acme in under 60 seconds.");
    expect(page.updatedAt).toBe("2026-05-01");
    expect(page.author).toEqual({ name: "Jane Doe", url: "https://acme.com/team/jane" });
    expect(page.topics).toEqual(["install", "quickstart"]);
    expect(page.citeUrl).toBe("https://acme.com/docs/install");
  });

  it("extracts FAQ from frontmatter + heading heuristics", async () => {
    const { page } = await compileFixture("content/docs/install.mdx");
    const questions = page.questions ?? [];
    const qs = questions.map((q) => q.q);
    // Frontmatter entry first (explicit wins).
    expect(qs).toContain("What runtime is required?");
    // "How do I install Acme?" — heading ending in "?".
    expect(qs).toContain("How do I install Acme?");
    // "Q: Can I use npm?" — "Q:" prefix is stripped.
    expect(qs).toContain("Can I use npm?");
    expect(questions.find((q) => q.q === "What runtime is required?")?.a).toBe("Node 20 or higher.");
  });

  it("strips JSX components from body Markdown by default", async () => {
    const { page } = await compileFixture("content/docs/install.mdx");
    // ESM import dropped:
    expect(page.body).not.toContain("import { Callout }");
    // JSX tag removed but text content survives:
    expect(page.body).not.toContain("<Callout");
    expect(page.body).toContain("Node 18 is no longer supported");
  });

  it("supports user-supplied JSX → Markdown component map", async () => {
    const abs = join(fixturesRoot, "content/docs/install.mdx");
    const source = await readFile(abs, "utf8");
    const { page } = compile({
      source,
      route: "/docs/install",
      file: abs,
      site: SITE,
      options: {
        components: {
          Callout: (props) => `> [${String(props.type ?? "info")}] callout`,
        },
      },
    });
    expect(page.body).toContain("> [warn] callout");
  });

  it("emits chunk children with breadcrumb and citeUrl", async () => {
    const { page, children } = await compileFixture("content/docs/install.mdx");
    const chunks = children.filter((c) => c.kind === "chunk");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.citeUrl?.startsWith("https://acme.com/docs/install"))).toBe(true);
    // Page lists all children by id.
    expect(page.children?.length).toBe(children.length);
  });

  it("produces deterministic ids", async () => {
    const a = await compileFixture("content/docs/install.mdx");
    const b = await compileFixture("content/docs/install.mdx");
    expect(a.page.id).toBe(b.page.id);
    expect(a.children.map((c) => c.id)).toEqual(b.children.map((c) => c.id));
  });

  it("handles route '/' for index.mdx and derives title from H1 when no frontmatter title", async () => {
    const { page } = await compileFixture("content/index.mdx");
    expect(page.route).toBe("/");
    expect(page.title).toBe("Welcome");
    expect(page.citeUrl).toBe("https://acme.com");
  });
});
