import { describe, expect, it } from "vitest";
import type { RootContent } from "mdast";
import type { Section } from "../src/headings.js";
import { chunkSections } from "../src/chunks.js";

function para(text: string): RootContent {
  return { type: "paragraph", children: [{ type: "text", value: text }] };
}

function section(title: string, paragraphs: string[], children: Section[] = []): Section {
  return {
    depth: 2,
    title,
    slug: title.toLowerCase().replace(/\s+/g, "-"),
    body: paragraphs.map(para),
    children,
  };
}

describe("chunkSections() overlap (X-06)", () => {
  it("carries tail blocks into the next chunk when overlap > 0", () => {
    const root = section("Intro", [
      "Block A has enough words to consume tokens.",
      "Block B continues the section with more detail.",
      "Block C adds even more content here.",
      "Block D finishes the long section body.",
    ]);
    const chunks = chunkSections(root, { maxTokens: 12, overlap: 6 });
    expect(chunks.length).toBeGreaterThan(1);
    const lastBlockFirst = chunks[0]!.body.split("\n\n").at(-1)!;
    expect(chunks[1]!.body).toContain(lastBlockFirst.slice(0, 20));
  });

  it("does not carry tail when overlap is 0", () => {
    const root = section("Intro", [
      "Alpha paragraph with several words inside.",
      "Beta paragraph with several words inside.",
      "Gamma paragraph with several words inside.",
      "Delta paragraph with several words inside.",
    ]);
    const chunks = chunkSections(root, { maxTokens: 8, overlap: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.body).not.toEqual(chunks[1]!.body);
  });

  it("resets buffer between sibling sections", () => {
    const root = section("Root", ["Root intro."], [
      section("Child A", ["Child A ".repeat(30)]),
      section("Child B", ["Child B unique start."]),
    ]);
    const chunks = chunkSections(root, { maxTokens: 20, overlap: 10 });
    const childBChunk = chunks.find((c) => c.breadcrumb.includes("Child B"));
    expect(childBChunk?.body).toContain("Child B unique start.");
    expect(childBChunk?.body).not.toContain("Child A");
  });
});
