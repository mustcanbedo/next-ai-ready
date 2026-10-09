import { describe, expect, it } from "vitest";
import { searchDocs } from "../lib/doc-search";
import type { DocMeta } from "../lib/docs";

function doc(overrides: Partial<DocMeta> = {}): DocMeta {
  return {
    title: "Overview",
    summary: "General documentation.",
    slug: "guides/overview",
    section: "guides",
    order: 99,
    ...overrides,
  };
}

describe("documentation search", () => {
  it.each(["", " \t\n", "install"])("returns no results for an empty collection and query %j", (query) => {
    expect(searchDocs([], query)).toEqual([]);
  });

  it.each(["", " ", " \t\r\n ", "\u3000"])("returns the first eight documents in input order for blank query %j", (query) => {
    const docs = Array.from({ length: 12 }, (_, index) => doc({
      title: `Page ${index}`,
      slug: `guides/page-${index}`,
      order: 12 - index,
    }));

    expect(searchDocs(docs, query)).toEqual(docs.slice(0, 8));
  });

  it("returns all available documents when a blank query has fewer than eight results", () => {
    const docs = [doc({ title: "Second", order: 2 }), doc({ title: "First", order: 1 })];

    expect(searchDocs(docs, "")).toEqual(docs);
  });

  it.each(["title", "slug", "summary"] as const)("matches %s case-insensitively", (field) => {
    const match = doc({ [field]: "InStAlL" });

    for (const query of ["install", "INSTALL", "iNsTaLl"]) {
      expect(searchDocs([doc(), match], query)).toEqual([match]);
    }
  });

  it.each(["title", "slug", "summary"] as const)("matches Chinese substrings in %s", (field) => {
    const match = doc({ [field]: "\u5b89\u88c5\u4e0e\u914d\u7f6e" });

    expect(searchDocs([doc(), match], "\u914d\u7f6e")).toEqual([match]);
  });

  it("requires every whitespace-separated term while allowing matches across fields", () => {
    const match = doc({ title: "Install", slug: "guides/next", summary: "Configure search." });
    const docs = [
      doc({ title: "Install search" }),
      doc({ slug: "guides/next", summary: "Search reference." }),
      doc({ title: "Install", slug: "guides/next" }),
      match,
    ];

    expect(searchDocs(docs, "  install\tNEXT\nsearch  ")).toEqual([match]);
  });

  it("uses AND matching for Chinese terms", () => {
    const match = doc({ title: "\u5b89\u88c5", summary: "\u914d\u7f6e\u5185\u5bb9\u76ee\u5f55" });
    const docs = [
      doc({ title: "\u5b89\u88c5" }),
      doc({ summary: "\u914d\u7f6e" }),
      match,
    ];

    expect(searchDocs(docs, "\u5b89\u88c5\u3000\u914d\u7f6e")).toEqual([match]);
  });

  it("returns no results for an unmatched query or empty searchable fields", () => {
    expect(searchDocs([doc(), doc({ title: "", summary: "", slug: "" })], "missing")).toEqual([]);
  });

  it("does not search section, author, or update metadata", () => {
    const docs = [doc({ section: "needle", author: "needle", updatedAt: "needle" })];

    expect(searchDocs(docs, "needle")).toEqual([]);
  });

  it("does not concatenate adjacent fields into a searchable term", () => {
    const docs = [doc({ title: "foo", summary: "bar", slug: "baz" })];

    expect(searchDocs(docs, "foobar")).toEqual([]);
    expect(searchDocs(docs, "barbaz")).toEqual([]);
  });

  it.each(["slug", "summary"] as const)("ranks title matches ahead of %s matches", (field) => {
    const otherMatch = doc({ [field]: "Search reference", order: 0 });
    const titleMatch = doc({ title: "Search reference", order: 100 });

    expect(searchDocs([otherMatch, titleMatch], "search")).toEqual([titleMatch, otherMatch]);
    expect(searchDocs([titleMatch, otherMatch], "search")).toEqual([titleMatch, otherMatch]);
  });

  it("limits matching results to eight after ranking the entire collection", () => {
    const lowerRanked = Array.from({ length: 10 }, (_, index) => doc({
      summary: "Search reference.",
      slug: `guides/page-${index}`,
    }));
    const titleMatch = doc({ title: "Search reference", slug: "guides/search" });
    const docs = [...lowerRanked, titleMatch, doc()];
    const results = searchDocs(docs, "search");

    expect(results).toHaveLength(8);
    expect(results[0]).toEqual(titleMatch);
    for (const result of results.slice(1)) {
      expect(lowerRanked).toContainEqual(result);
    }
  });

  it.each(["", "search"])("preserves complete document metadata for query %j", (query) => {
    const match: DocMeta = {
      title: "Search reference",
      summary: "Configure the documentation index.",
      slug: "api-reference/search",
      section: "api-reference",
      order: 7,
      updatedAt: "2026-10-09",
      author: "Docs team",
    };

    expect(searchDocs([match], query)).toEqual([match]);
  });

  it.each(["", "search"])("does not mutate the input array or metadata for query %j", (query) => {
    const docs = [
      doc({ summary: "Search reference.", author: "Docs team" }),
      doc({ title: "Search reference", updatedAt: "2026-10-09" }),
      doc({ title: "Unrelated" }),
    ];
    const before = docs.map((entry) => ({ ...entry }));
    for (const entry of docs) Object.freeze(entry);
    Object.freeze(docs);

    const results = searchDocs(docs, query);

    expect(results).toHaveLength(query ? 2 : 3);
    expect(docs).toEqual(before);
  });

  it("searches only the supplied language collection without leaking between calls", () => {
    const enDocs = [doc({ title: "Install", slug: "installation" })];
    const zhDocs = [doc({ title: "\u5b89\u88c5", slug: "installation" })];

    expect(searchDocs(enDocs, "installation")).toEqual(enDocs);
    expect(searchDocs(zhDocs, "installation")).toEqual(zhDocs);
    expect(searchDocs(enDocs, "\u5b89\u88c5")).toEqual([]);
    expect(searchDocs(zhDocs, "\u5b89\u88c5")).toEqual(zhDocs);
    expect(searchDocs(enDocs, "")).toEqual(enDocs);
    expect(searchDocs(zhDocs, "")).toEqual(zhDocs);
  });
});
