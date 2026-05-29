/**
 * Stable JSON serializer.
 *
 * All artifacts emitted by next-ai-ready (graph.json, actions.manifest.json,
 * openapi.json, tools.json, *.ai.json) must be deterministic so they're
 * reviewable in git, cacheable in CI, and free of spurious drift.
 *
 * See ADR-015.
 */

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object" && value.constructor === Object) {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeys(obj[key]);
    }
    return out;
  }
  return value;
}

export interface SerializeOptions {
  /** Indent width in spaces. Default 2. */
  indent?: number;
  /** Whether to sort object keys recursively. Default true. */
  sortKeys?: boolean;
}

export function serializeStable(value: unknown, opts: SerializeOptions = {}): string {
  const { indent = 2, sortKeys: shouldSort = true } = opts;
  const prepared = shouldSort ? sortKeys(value) : value;
  return JSON.stringify(prepared, null, indent) + "\n";
}
