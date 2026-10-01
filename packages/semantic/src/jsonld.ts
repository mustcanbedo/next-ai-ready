import type { SemanticGraph, SiteInfo } from "@next-ai-ready/core";
import { absoluteUrl } from "@next-ai-ready/core/url";

/**
 * Emit Schema.org JSON-LD blocks for one page.
 *
 * Coverage:
 *   • Every page → `WebPage` (always) + `Article` (when authored).
 *   • FAQ entries → `FAQPage` (when any).
 *   • Route depth > 0 → `BreadcrumbList`.
 *   • Site → `Organization` (emitted separately via `siteJsonLd`).
 *
 * All output objects are JSON-LD `@context`-prefixed and ready to be embedded
 * in a `<script type="application/ld+json">` tag.
 */
export function pageJsonLd(graph: SemanticGraph, route: string): Record<string, unknown>[] {
  const id = graph.routes[route];
  if (!id) return [];
  const page = graph.nodes[id];
  if (!page) return [];

  const blocks: Record<string, unknown>[] = [];
  const site = graph.site;
  const url = page.citeUrl ?? absoluteUrl(site.baseUrl, route);

  blocks.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    name: page.title,
    description: page.summary,
    url,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.baseUrl },
    dateModified: page.updatedAt,
  });

  if (page.author) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.summary,
      url,
      author: { "@type": "Person", name: page.author.name, url: page.author.url },
      ...(page.reviewedBy
        ? { reviewedBy: { "@type": "Person", name: page.reviewedBy.name } }
        : {}),
      datePublished: page.updatedAt,
      dateModified: page.updatedAt,
      keywords: page.topics?.join(", "),
      ...(site.organization
        ? { publisher: { "@type": "Organization", name: site.organization.name, url: site.organization.url, logo: site.organization.logo } }
        : {}),
    });
  }

  if (page.questions && page.questions.length > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.questions.map((qa) => ({
        "@type": "Question",
        name: qa.q,
        acceptedAnswer: { "@type": "Answer", text: qa.a },
      })),
    });
  }

  const breadcrumb = buildBreadcrumb(graph, route);
  if (breadcrumb) blocks.push(breadcrumb);

  return blocks.map(stripUndefined);
}

export function siteJsonLd(site: SiteInfo): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.baseUrl,
      description: site.description,
    },
  ];
  if (site.organization) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.organization.name,
      url: site.organization.url ?? site.baseUrl,
      logo: site.organization.logo,
    });
  }
  return blocks.map(stripUndefined);
}

function buildBreadcrumb(graph: SemanticGraph, route: string): Record<string, unknown> | undefined {
  if (route === "/") return undefined;
  const parts = route.split("/").filter(Boolean);
  if (parts.length === 0) return undefined;
  const site = graph.site;
  const root = graph.nodes[graph.routes["/"] ?? ""];
  const home = root?.kind === "page" ? root : undefined;
  const homeUrl = home?.citeUrl ?? absoluteUrl(site.baseUrl, "/");
  const items = [
    { "@type": "ListItem", position: 1, name: home?.title ?? site.name, item: homeUrl },
  ];
  const seen = new Set([new URL(homeUrl).href]);
  let accum = "";
  parts.forEach((part, i) => {
    accum += `/${part}`;
    const ancestorRoute = i === parts.length - 1 ? route : accum;
    const ancestor = graph.nodes[graph.routes[ancestorRoute] ?? ""];
    // A URL directory is not necessarily a navigable content page.
    if (ancestor?.kind !== "page") return;
    const url = ancestor.citeUrl ?? absoluteUrl(site.baseUrl, ancestorRoute);
    const key = new URL(url).href;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name: ancestor.title ?? titleize(part),
      item: url,
    });
  });
  if (items.length < 2) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function titleize(s: string): string {
  return s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) {
    if (obj[k] === undefined) delete (obj as Record<string, unknown>)[k];
  }
  return obj;
}
