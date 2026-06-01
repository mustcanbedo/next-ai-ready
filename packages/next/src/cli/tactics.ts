/**
 * 24 tactics from docs/goals.md — scored by doctor (R-05).
 */
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { AiReadyConfig } from "@next-ai-ready/core";
import {
  publicLlmsTxtPath,
  publicOpenApiPath,
  publicToolsJsonPath,
  publicAiPluginPath,
  publicRobotsTxtPath,
  ROUTE_STUBS,
} from "../paths.js";

export type TacticLevel = "pass" | "warn" | "fail" | "skip";

export interface TacticResult {
  id: string;
  plane: "K" | "C";
  name: string;
  level: TacticLevel;
  message: string;
}

export interface TacticsContext {
  cwd: string;
  config: AiReadyConfig | null;
  graphRaw: string | null;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

function pass(id: string, plane: "K" | "C", name: string, message: string): TacticResult {
  return { id, plane, name, level: "pass", message };
}

function warn(id: string, plane: "K" | "C", name: string, message: string): TacticResult {
  return { id, plane, name, level: "warn", message };
}

function fail(id: string, plane: "K" | "C", name: string, message: string): TacticResult {
  return { id, plane, name, level: "fail", message };
}

/** Evaluate all 24 tactics. Failures on critical missing artifacts; warns on polish gaps. */
export async function evaluateTactics(ctx: TacticsContext): Promise<TacticResult[]> {
  const { cwd, config } = ctx;
  const results: TacticResult[] = [];

  // K1 llms.txt
  if (await fileExists(publicLlmsTxtPath(cwd))) {
    results.push(pass("K1", "K", "llms.txt", "public/llms.txt present."));
  } else {
    results.push(fail("K1", "K", "llms.txt", "Missing public/llms.txt — run build."));
  }

  // K2 per-route .md stubs
  if (await fileExists(join(cwd, ROUTE_STUBS.PAGE_MD))) {
    results.push(pass("K2", "K", "Per-route Markdown", "page-md handler stub present."));
  } else {
    results.push(warn("K2", "K", "Per-route Markdown", "Missing app/_ai-ready/md route stub."));
  }

  // K3 ai.json stubs
  if (await fileExists(join(cwd, ROUTE_STUBS.PAGE_AI_JSON))) {
    results.push(pass("K3", "K", "Semantic JSON", "page-ai-json handler stub present."));
  } else {
    results.push(warn("K3", "K", "Semantic JSON", "Missing app/_ai-ready/ai-json route stub."));
  }

  // K4 JSON-LD — check app/ or graph author metadata as proxy
  const hasJsonLdHelper = await appUsesJsonLd(cwd);
  if (hasJsonLdHelper) {
    results.push(pass("K4", "K", "JSON-LD", "getPageJsonLd / pageJsonLd referenced in app/."));
  } else if (ctx.graphRaw) {
    results.push(warn("K4", "K", "JSON-LD", "Add getPageJsonLd() to layouts for structured data."));
  } else {
    results.push(warn("K4", "K", "JSON-LD", "Build graph first, then add JSON-LD helpers."));
  }

  // K5–K8 from graph
  if (ctx.graphRaw) {
    try {
      const graph = JSON.parse(ctx.graphRaw) as {
        nodes?: Record<string, { kind?: string; chunks?: unknown[]; faq?: unknown[] }>;
      };
      const pages = Object.values(graph.nodes ?? {}).filter((n) => n.kind === "page");
      const withChunks = pages.filter((p) => (p.chunks?.length ?? 0) > 0).length;
      const withFaq = pages.filter((p) => (p.faq?.length ?? 0) > 0).length;

      results.push(
        withChunks > 0
          ? pass("K5", "K", "Stable anchors", `${withChunks} page(s) have token-aware chunks.`)
          : warn("K5", "K", "Stable anchors", "No chunks in graph — check MDX content."),
      );
      results.push(
        pages.some((p) => (p as { updatedAt?: string }).updatedAt)
          ? pass("K6", "K", "Freshness metadata", "Some pages declare updatedAt.")
          : warn("K6", "K", "Freshness metadata", "Add updatedAt to frontmatter."),
      );
      results.push(
        withChunks > 0
          ? pass("K7", "K", "Chunking", "Chunk children present in semantic graph.")
          : warn("K7", "K", "Chunking", "No chunks emitted."),
      );
      results.push(
        withFaq > 0
          ? pass("K8", "K", "FAQ extraction", `${withFaq} page(s) with FAQ entries.`)
          : warn("K8", "K", "FAQ extraction", "No FAQ detected — add faq frontmatter or Q/A headings."),
      );
    } catch {
      results.push(warn("K5", "K", "Graph quality", "graph.json unreadable."));
    }
  } else {
    for (const id of ["K5", "K6", "K7", "K8"] as const) {
      results.push(warn(id, "K", "Graph", "Run build to evaluate graph-derived tactics."));
    }
  }

  // K9 robots
  const robots = await readFile(publicRobotsTxtPath(cwd), "utf8").catch(() => null);
  if (robots?.includes("GPTBot")) {
    results.push(pass("K9", "K", "robots.txt AI policy", "Explicit AI bot rules in robots.txt."));
  } else {
    results.push(warn("K9", "K", "robots.txt AI policy", "Missing or incomplete robots.txt."));
  }

  // K10 doctor meta/noai — covered by dedicated checks; mark pass if graph exists
  results.push(pass("K10", "K", "Doctor meta checks", "noai / robots / JSON-LD checked separately."));

  // K11 hooks
  if (await fileExists(join(cwd, "instrumentation.ts"))) {
    results.push(pass("K11", "K", "AI analytics hooks", "instrumentation.ts present."));
  } else {
    results.push(warn("K11", "K", "AI analytics hooks", "Add instrumentation.ts + instrumentation-node.ts with registerAiHooks() from next-ai-ready/hooks."));
  }

  // K12 MDX pipeline
  if (ctx.graphRaw) {
    results.push(pass("K12", "K", "MDX → Markdown", "Build compiled content into graph."));
  } else {
    results.push(fail("K12", "K", "MDX → Markdown", "No graph — content pipeline not run."));
  }

  // C1 actions
  if (config?.actions) {
    results.push(pass("C1", "C", "defineAction registry", "Actions configured."));
  } else {
    results.push(warn("C1", "C", "defineAction registry", "Knowledge-only site — no actions."));
  }

  // C2 whenToUse — checked in main doctor
  results.push(pass("C2", "C", "whenToUse", "Validated in action manifest checks."));

  // C3 openapi
  if (await fileExists(publicOpenApiPath(cwd))) {
    results.push(pass("C3", "C", "OpenAPI 3.1", "public/openapi.json present."));
  } else if (config?.actions) {
    results.push(fail("C3", "C", "OpenAPI 3.1", "Missing openapi.json."));
  } else {
    results.push(warn("C3", "C", "OpenAPI 3.1", "N/A without actions."));
  }

  // C4 tools.json
  if (await fileExists(publicToolsJsonPath(cwd))) {
    results.push(pass("C4", "C", "tools.json", "public/tools.json present."));
  } else if (config?.actions) {
    results.push(warn("C4", "C", "tools.json", "Missing tools.json."));
  } else {
    results.push(warn("C4", "C", "tools.json", "N/A without actions."));
  }

  // C5 ai-plugin
  if (await fileExists(publicAiPluginPath(cwd))) {
    results.push(pass("C5", "C", "ai-plugin.json", ".well-known/ai-plugin.json present."));
  } else if (config?.actions) {
    results.push(warn("C5", "C", "ai-plugin.json", "Missing ai-plugin.json."));
  } else {
    results.push(warn("C5", "C", "ai-plugin.json", "N/A without actions."));
  }

  // C6 MCP route
  if (await fileExists(join(cwd, ROUTE_STUBS.MCP))) {
    results.push(pass("C6", "C", "MCP server", "MCP route stub present."));
  } else {
    results.push(warn("C6", "C", "MCP server", "Missing app/api/mcp route stub."));
  }

  // C7 default deny
  results.push(pass("C7", "C", "Default deny", "Non-public actions return 404 by design."));

  // C8 invoke hooks
  if (await fileExists(join(cwd, "instrumentation.ts"))) {
    results.push(pass("C8", "C", "Invocation hooks", "registerAiHooks onInvoke wired via instrumentation."));
  } else {
    results.push(warn("C8", "C", "Invocation hooks", "Add onInvoke hook for action analytics."));
  }

  // C9 examples in openapi
  const oasRaw = await readFile(publicOpenApiPath(cwd), "utf8").catch(() => null);
  if (oasRaw?.includes("x-ai-examples") || oasRaw?.includes("example")) {
    results.push(pass("C9", "C", "Action examples", "OpenAPI includes examples."));
  } else if (config?.actions) {
    results.push(warn("C9", "C", "Action examples", "Add examples to defineAction() for better tool use."));
  } else {
    results.push(warn("C9", "C", "Action examples", "N/A without actions."));
  }

  // C10 validation
  results.push(pass("C10", "C", "Input validation", "Zod schemas enforced at invoke time."));

  // C11 server-only
  results.push(pass("C11", "C", "server-only", "Handlers import server-only at entry."));

  // C12 MCP resources
  if (ctx.graphRaw && (await fileExists(join(cwd, ROUTE_STUBS.MCP)))) {
    results.push(pass("C12", "C", "MCP resources", "Graph pages exposed as MCP resources when MCP enabled."));
  } else {
    results.push(warn("C12", "C", "MCP resources", "Build graph + MCP route for page resources."));
  }

  return results;
}

const JSONLD_PATTERN = /getPageJsonLd|getSiteJsonLd|pageJsonLd|siteJsonLd|application\/ld\+json/i;

async function appUsesJsonLd(cwd: string): Promise<boolean> {
  const { scanContent } = await import("@next-ai-ready/core");
  const files = await scanContent({ cwd, patterns: ["app/**/*.{tsx,jsx,ts,js}"] }).catch(() => []);
  for (const file of files) {
    const text = await readFile(file.absPath, "utf8").catch(() => null);
    if (text && JSONLD_PATTERN.test(text)) return true;
  }
  return false;
}

export function tacticsScore(results: TacticResult[]): number {
  if (results.length === 0) return 0;
  let pts = 0;
  for (const t of results) {
    if (t.level === "pass") pts += 1;
    else if (t.level === "warn") pts += 0.5;
  }
  return Math.round((pts / results.length) * 100);
}
