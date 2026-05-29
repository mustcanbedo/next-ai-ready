import { describe, expect, it } from "vitest";
import { stableId } from "../src/id.js";
import { serializeStable } from "../src/json.js";
import { fileToRoute } from "../src/scanner.js";
import { identifyAiBot } from "../src/bots.js";
import { defineConfig, withDefaults } from "../src/config.js";

describe("stableId()", () => {
  it("returns a 16-char hex string", () => {
    const id = stableId("route", "page");
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic — same input → same id", () => {
    expect(stableId("/docs", "section", "install")).toBe(
      stableId("/docs", "section", "install"),
    );
  });

  it("different parts → different ids", () => {
    expect(stableId("a", "b")).not.toBe(stableId("ab"));
  });

  it("part ordering matters", () => {
    expect(stableId("a", "b")).not.toBe(stableId("b", "a"));
  });
});

describe("serializeStable()", () => {
  it("sorts keys by default and adds trailing newline", () => {
    const out = serializeStable({ b: 2, a: 1 });
    expect(out).toBe('{\n  "a": 1,\n  "b": 2\n}\n');
  });

  it("recursively sorts nested objects", () => {
    const out = serializeStable({ z: { b: 2, a: 1 }, a: [] });
    const parsed = JSON.parse(out);
    expect(Object.keys(parsed)).toEqual(["a", "z"]);
    expect(Object.keys(parsed.z)).toEqual(["a", "b"]);
  });

  it("respects sortKeys: false", () => {
    const out = serializeStable({ b: 2, a: 1 }, { sortKeys: false });
    const keys = Object.keys(JSON.parse(out));
    expect(keys).toEqual(["b", "a"]);
  });

  it("respects custom indent", () => {
    const out = serializeStable({ a: 1 }, { indent: 4 });
    expect(out).toContain("    ");
  });

  it("handles arrays without reordering elements", () => {
    const out = serializeStable([3, 1, 2]);
    expect(JSON.parse(out)).toEqual([3, 1, 2]);
  });
});

describe("fileToRoute()", () => {
  it("app/docs/getting-started/page.mdx → /docs/getting-started", () => {
    expect(fileToRoute("app/docs/getting-started/page.mdx")).toBe("/docs/getting-started");
  });

  it("app/blog/(marketing)/hello/page.md → /blog/hello", () => {
    expect(fileToRoute("app/blog/(marketing)/hello/page.md")).toBe("/blog/hello");
  });

  it("content/docs/install.mdx → /docs/install", () => {
    expect(fileToRoute("content/docs/install.mdx")).toBe("/docs/install");
  });

  it("content/index.mdx → /", () => {
    expect(fileToRoute("content/index.mdx")).toBe("/");
  });

  it("strips private folders starting with _", () => {
    expect(fileToRoute("app/_internal/debug/page.mdx")).toBe("/debug");
  });

  it("handles .md extension", () => {
    expect(fileToRoute("content/guide.md")).toBe("/guide");
  });
});

describe("identifyAiBot()", () => {
  it("identifies GPTBot", () => {
    expect(identifyAiBot("Mozilla/5.0 GPTBot/1.0")).toBe("GPTBot");
  });

  it("identifies ClaudeBot", () => {
    expect(identifyAiBot("ClaudeBot/1.0")).toBe("ClaudeBot");
  });

  it("identifies PerplexityBot", () => {
    expect(identifyAiBot("Mozilla/5.0 PerplexityBot")).toBe("PerplexityBot");
  });

  it("returns undefined for regular browsers", () => {
    expect(identifyAiBot("Mozilla/5.0 (Macintosh)")).toBeUndefined();
  });

  it("returns undefined for null/undefined/empty", () => {
    expect(identifyAiBot(null)).toBeUndefined();
    expect(identifyAiBot(undefined)).toBeUndefined();
    expect(identifyAiBot("")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(identifyAiBot("gptbot")).toBe("GPTBot");
  });
});

describe("defineConfig()", () => {
  it("returns the same config object", () => {
    const cfg = { site: { name: "X", baseUrl: "https://x.com" } };
    expect(defineConfig(cfg)).toBe(cfg);
  });
});

describe("withDefaults()", () => {
  it("fills in default content patterns when omitted", () => {
    const cfg = { site: { name: "X", baseUrl: "https://x.com" } };
    const result = withDefaults(cfg);
    expect(result.content).toEqual(["app/**/*.{md,mdx}", "content/**/*.mdx"]);
  });

  it("preserves user-supplied content patterns", () => {
    const cfg = { site: { name: "X", baseUrl: "https://x.com" }, content: ["pages/**/*.md"] };
    const result = withDefaults(cfg);
    expect(result.content).toEqual(["pages/**/*.md"]);
  });
});
