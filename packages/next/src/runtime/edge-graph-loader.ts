import type { SemanticGraph } from "@next-ai-ready/core";

let cached: Promise<SemanticGraph> | null = null;
let cachedUrl: string | null = null;

/**
 * Load a SemanticGraph over HTTP(S) for Edge runtimes (P6-04).
 * Point at a deployed `graph.json` URL or a same-origin path.
 */
export async function loadGraphFromFetch(url: string, init?: RequestInit): Promise<SemanticGraph> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`[next-ai-ready] Failed to load graph from ${url}: ${res.status}`);
  }
  return (await res.json()) as SemanticGraph;
}

/** Per-process cached Edge loader factory. */
export function createEdgeGraphLoader(getUrl: () => string): () => Promise<SemanticGraph> {
  return () => {
    const url = getUrl();
    if (cached && cachedUrl === url) return cached;
    cachedUrl = url;
    cached = loadGraphFromFetch(url);
    return cached;
  };
}

export function invalidateEdgeGraphCache(): void {
  cached = null;
  cachedUrl = null;
}
