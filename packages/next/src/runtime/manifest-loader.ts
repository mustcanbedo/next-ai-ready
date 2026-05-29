// No `import "server-only"` — see graph-loader.ts for the rationale. This is a
// shared Node utility consumed by both handlers and the CLI.
import { readFile } from "node:fs/promises";
import type { ActionsManifest } from "@next-ai-ready/core";
import { actionsManifestPath } from "../paths.js";

/**
 * Per-process cached loader for `.next-ai-ready/actions.manifest.json`.
 *
 * Mirrors `graph-loader.ts` for symmetry: build CLI writes it, runtime route
 * handlers (openapi.json, tools.json) read it once and cache it.
 *
 * Note: this manifest contains only metadata + JSON Schemas — never function
 * references. Actual action invocation goes through `getAction()` against
 * the registry singleton, which is populated by the user's `actions/index.ts`
 * being imported by the action route file.
 */
let cached: Promise<ActionsManifest | null> | null = null;
let cachedRoot: string | null = null;

export function loadActionsManifest(projectRoot: string = process.cwd()): Promise<ActionsManifest | null> {
  if (cached && cachedRoot === projectRoot) return cached;
  cachedRoot = projectRoot;
  cached = readFile(actionsManifestPath(projectRoot), "utf8")
    .then((raw) => JSON.parse(raw) as ActionsManifest)
    .catch((err: NodeJS.ErrnoException) => {
      // No manifest = no actions configured. Don't blow up the server.
      if (err.code === "ENOENT") return null;
      throw err;
    });
  return cached;
}

export function invalidateManifestCache(): void {
  cached = null;
  cachedRoot = null;
}
