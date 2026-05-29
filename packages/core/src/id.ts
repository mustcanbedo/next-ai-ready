import { createHash } from "node:crypto";

/**
 * Deterministic, short, URL-safe id from arbitrary string parts.
 *
 * The graph uses these as node ids. Stability is critical: changing how we
 * compute ids would invalidate every cached artifact downstream.
 */
export function stableId(...parts: string[]): string {
  const h = createHash("sha256");
  for (const p of parts) {
    h.update(p);
    h.update("\u0000"); // null separator to avoid ambiguity
  }
  return h.digest("hex").slice(0, 16);
}
