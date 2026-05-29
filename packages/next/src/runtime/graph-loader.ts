// NOTE: deliberately NO `import "server-only"` here. This loader is a plain
// Node utility shared by both runtime route handlers AND the build/MCP CLIs.
// The `server-only` guard lives in the handler entry files (the modules that
// could theoretically be pulled into a client bundle); putting it here would
// crash the CLI, which runs in plain Node without the `react-server` export
// condition.
import { readFile } from "node:fs/promises";
import type { SemanticGraph } from "@next-ai-ready/core";
import { graphPath } from "../paths.js";

/**
 * Lazy, per-process cached loader for `.next-ai-ready/graph.json`.
 *
 * Strategy:
 *   • Read once per process at first access (typical serverless cold start).
 *   • Subsequent requests reuse the in-memory parsed graph — no file IO.
 *   • Invalidation: a new deploy → a new process → re-reads.
 *
 * Why not require/import? The file is data, not code. We avoid bundling it
 * into the route handler so updates don't require a Next rebuild during dev.
 * `outputFileTracingIncludes` (set by `withAiReady`) ensures it ships with
 * the serverless function bundle in production.
 */
let cached: Promise<SemanticGraph> | null = null;
let cachedRoot: string | null = null;

export function loadGraph(projectRoot: string = process.cwd()): Promise<SemanticGraph> {
  if (cached && cachedRoot === projectRoot) return cached;
  cachedRoot = projectRoot;
  cached = readFile(graphPath(projectRoot), "utf8").then((raw) => JSON.parse(raw) as SemanticGraph);
  return cached;
}

/** For tests / dev-watch — drop the cache so the next call re-reads disk. */
export function invalidateGraphCache(): void {
  cached = null;
  cachedRoot = null;
}
