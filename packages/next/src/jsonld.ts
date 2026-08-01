import { pageJsonLd, siteJsonLd } from "@next-ai-ready/semantic/jsonld";
import type { SemanticGraph, SiteInfo } from "@next-ai-ready/core";
import { loadGraph } from "./runtime/graph-loader.js";

/**
 * Return Schema.org JSON-LD blocks for a single page, loaded from the
 * cached build artifact.
 *
 * Use this in a Next.js page component to inject structured data:
 *
 * ```tsx
 *   import { getPageJsonLd } from "@next-ai-ready/next";
 *
 *   export default async function Page({ params }) {
 *     const jsonLd = await getPageJsonLd(`/${params.slug}`);
 *     return (
 *       <>
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 *         />
 *         {/* ... *\/}
 *       </>
 *     );
 *   }
 * ```
 *
 * Returns an empty array when the route is not in the graph (e.g. dynamic
 * pages that aren't content routes).
 */
export async function getPageJsonLd(route: string): Promise<Record<string, unknown>[]> {
  const graph = await loadGraph();
  if (!graph) return [];
  return pageJsonLd(graph, route);
}

/**
 * Return Schema.org JSON-LD blocks for the site root (WebSite +
 * optional Organization). Useful for the root layout.
 *
 * ```tsx
 *   import { getSiteJsonLd } from "@next-ai-ready/next";
 *
 *   export default async function RootLayout({ children }) {
 *     const jsonLd = await getSiteJsonLd();
 *     return (
 *       <html>
 *         <head>
 *           <script
 *             type="application/ld+json"
 *             dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 *           />
 *         </head>
 *         <body>{children}</body>
 *       </html>
 *     );
 *   }
 * ```
 */
export async function getSiteJsonLd(): Promise<Record<string, unknown>[]> {
  const graph = await loadGraph();
  if (!graph) return [];
  return siteJsonLd(graph.site);
}

/**
 * Synchronous variant: pass a pre-loaded graph. Useful when you already
 * have the graph from another source (e.g. `getPageNodes`).
 */
export function pageJsonLdFromGraph(graph: SemanticGraph, route: string): Record<string, unknown>[] {
  return pageJsonLd(graph, route);
}

/**
 * Synchronous variant for site-level JSON-LD.
 */
export function siteJsonLdFromGraph(site: SiteInfo): Record<string, unknown>[] {
  return siteJsonLd(site);
}
