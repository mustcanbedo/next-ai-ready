import type { SemanticGraph, SemanticNode, SiteInfo } from "@next-ai-ready/core";
import { absoluteUrl } from "@next-ai-ready/core";

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

  const breadcrumb = buildBreadcrumb(site, route);
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

function buildBreadcrumb(site: SiteInfo, route: string): Record<string, unknown> | undefined {
  if (route === "/") return undefined;
  const parts = route.split("/").filter(Boolean);
  if (parts.length === 0) return undefined;
  const items: unknown[] = [
    { "@type": "ListItem", position: 1, name: site.name, item: site.baseUrl },
  ];
  let accum = "";
  parts.forEach((part, i) => {
    accum += `/${part}`;
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name: titleize(part),
      item: site.baseUrl + accum,
    });
  });
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
