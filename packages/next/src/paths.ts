import { join } from "node:path";

/**
 * Filesystem layout of build artifacts (ADR-006, ADR-011).
 *
 *   <projectRoot>/
 *     .next-ai-ready/
 *       graph.json              ← SemanticGraph, read by per-route handlers
 *       actions.manifest.json   ← (Phase 3) action schemas without handlers
 *     public/
 *       llms.txt                ← static, served by Next directly
 *       llms-full.txt
 *
 * Everything below uses these helpers — never hard-code paths.
 */

export const AI_READY_DIR = ".next-ai-ready";

export function graphPath(projectRoot: string): string {
  return join(projectRoot, AI_READY_DIR, "graph.json");
}

export function actionsManifestPath(projectRoot: string): string {
  return join(projectRoot, AI_READY_DIR, "actions.manifest.json");
}

export function publicLlmsTxtPath(projectRoot: string): string {
  return join(projectRoot, "public", "llms.txt");
}

export function publicLlmsFullTxtPath(projectRoot: string): string {
  return join(projectRoot, "public", "llms-full.txt");
}

export function publicRobotsTxtPath(projectRoot: string): string {
  return join(projectRoot, "public", "robots.txt");
}

export function publicOpenApiPath(projectRoot: string): string {
  return join(projectRoot, "public", "openapi.json");
}

export function publicToolsJsonPath(projectRoot: string): string {
  return join(projectRoot, "public", "tools.json");
}

export function publicAiPluginPath(projectRoot: string): string {
  return join(projectRoot, "public", ".well-known", "ai-plugin.json");
}

// Route stub paths (relative to project root).
export const ROUTE_STUBS = {
  LLMS_TXT: "app/_ai-ready/llms-txt/route.ts",
  LLMS_FULL: "app/_ai-ready/llms-full/route.ts",
  PAGE_MD: "app/_ai-ready/md/[...path]/route.ts",
  PAGE_AI_JSON: "app/_ai-ready/ai-json/[...path]/route.ts",
  OPENAPI: "app/_ai-ready/openapi/route.ts",
  TOOLS: "app/_ai-ready/tools/route.ts",
  ACTION: "app/api/actions/[name]/route.ts",
  MCP: "app/api/mcp/[transport]/route.ts",
} as const;
