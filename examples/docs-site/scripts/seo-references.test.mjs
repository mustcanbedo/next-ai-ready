import assert from "node:assert/strict";
import { test } from "node:test";
import { assertBreadcrumbTrail, assertIndexableHtml, collectSeoReferences } from "./seo-references.mjs";

test("reads actual HTML links and decodes attributes without treating code samples as links", () => {
  const result = collectSeoReferences(`
    <a href="../installation?x=1&amp;y=2#install">Install</a>
    <h2 id="install">Install</h2>
    <pre>&lt;a href="/docs/example"&gt;Example&lt;/a&gt;</pre>
    <a href="mailto:hello@example.com">Contact</a>
  `, "https://example.com/zh/docs/guides/quickstart");
  assert.deepEqual(result.links.map(String), [
    "https://example.com/zh/docs/installation?x=1&y=2#install",
    "mailto:hello@example.com",
  ]);
  assert.ok(result.ids.has("install"));
});

test("reads breadcrumb JSON-LD arrays and graph blocks", () => {
  const breadcrumb = { "@type": "BreadcrumbList", itemListElement: [{ item: "https://example.com" }] };
  for (const value of [breadcrumb, [breadcrumb], { "@graph": [breadcrumb] }]) {
    const html = `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
    assert.deepEqual(collectSeoReferences(html, "https://example.com").breadcrumbs, [breadcrumb]);
  }
});

test("fails instead of silently ignoring invalid JSON-LD", () => {
  assert.throws(() => collectSeoReferences('<script type="application/ld+json">{invalid}</script>', "https://example.com"), SyntaxError);
});

test("rejects headers or metadata that block indexing, and non-HTML responses", () => {
  const refs = collectSeoReferences('<meta name="Googlebot" content="NOINDEX, follow">', "https://example.com");
  const html = new Response("", { headers: { "content-type": "text/html" } });
  assert.throws(() => assertIndexableHtml(html, refs), /indexable/);
  for (const value of ["noindex", "none", "googlebot: NOINDEX"]) {
    const response = new Response("", { headers: { "content-type": "text/html", "x-robots-tag": value } });
    assert.throws(() => assertIndexableHtml(response, { noindex: false }), /indexable/);
  }
  assert.throws(() => assertIndexableHtml(new Response("", { headers: { "content-type": "text/markdown" } }), { noindex: false }), /HTML 200/);
  assert.doesNotThrow(() => assertIndexableHtml(html, { noindex: false }));
});

test("requires a breadcrumb to end at its own page and rejects unrelated or duplicate URLs", () => {
  const home = "https://example.com/";
  const current = "https://example.com/en/docs/install";
  const allowed = new Set([home, "https://example.com/en", current]);
  const items = [
    { position: 1, name: "Home", item: home },
    { position: 2, name: "Install", item: current },
  ];
  assert.doesNotThrow(() => assertBreadcrumbTrail(items, current, allowed));
  assert.throws(() => assertBreadcrumbTrail([items[0], { ...items[1], item: "https://example.com/en" }], current, allowed), /current page/);
  assert.throws(() => assertBreadcrumbTrail([items[0], { ...items[1], item: "https://example.com/en/docs/other" }], current, allowed), /ancestor/);
  assert.throws(() => assertBreadcrumbTrail([items[0], { ...items[1], item: "https://EXAMPLE.com:443" }], current, allowed), /ancestor/);
});
