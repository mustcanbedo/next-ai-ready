import { parse } from "parse5";

export function collectSeoReferences(html, pageUrl) {
  const links = [];
  const breadcrumbs = [];
  const ids = new Set();
  let noindex = false;

  function visit(node) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === "meta" && /^(robots|googlebot)$/i.test(attrs.name ?? "")) {
      noindex ||= /\b(noindex|none)\b/i.test(attrs.content ?? "");
    }
    if (node.tagName === "a" && attrs.href) {
      links.push(new URL(attrs.href, pageUrl));
    }
    if (node.tagName === "script" && attrs.type === "application/ld+json") {
      const text = node.childNodes.map((child) => child.value ?? "").join("");
      collectBreadcrumbs(JSON.parse(text));
    }
    for (const child of node.childNodes ?? []) visit(child);
  }

  function collectBreadcrumbs(value) {
    if (Array.isArray(value)) {
      value.forEach(collectBreadcrumbs);
    } else if (value && typeof value === "object") {
      const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
      if (types.includes("BreadcrumbList")) breadcrumbs.push(value);
      if (value["@graph"]) collectBreadcrumbs(value["@graph"]);
    }
  }

  visit(parse(html));
  return { links, breadcrumbs, ids, noindex };
}

export function assertIndexableHtml(response, refs) {
  if (response.status !== 200 || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("expected HTML 200");
  }
  if (refs.noindex || /\b(noindex|none)\b/i.test(response.headers.get("x-robots-tag") ?? "")) {
    throw new Error("HTML page must be indexable");
  }
}

export function assertBreadcrumbTrail(items, pageUrl, allowedUrls) {
  if (!Array.isArray(items) || items.length < 2) throw new Error("invalid breadcrumb trail");
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const url = new URL(item.item).href;
    if (item.position !== index + 1 || !item.name || !allowedUrls.has(url) || seen.has(url)) {
      throw new Error(`invalid breadcrumb ancestor: ${JSON.stringify(item)}`);
    }
    seen.add(url);
  }
  if (new URL(items.at(-1).item).href !== new URL(pageUrl).href) {
    throw new Error("breadcrumb trail must end at the current page");
  }
}
