import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { AI_BOTS, scanContent } from "@next-ai-ready/core";
import {
  buildActionsManifest,
  clearRegistry,
  listActions,
  registerActions,
} from "@next-ai-ready/actions";
import { graphPath, publicOpenApiPath, publicRobotsTxtPath, ROUTE_STUBS } from "../paths.js";
import { loadConfig } from "./load-config.js";
import { evaluateTactics, tacticsScore, type TacticResult } from "./tactics.js";

export interface Diagnostic {
  level: "error" | "warn" | "ok";
  message: string;
}

export interface DoctorResult {
  diagnostics: Diagnostic[];
  errors: number;
  warnings: number;
  /** Overall AI-readiness score (0–100). Only present when `score` option is set. */
  score?: number;
  /** Machine-readable JSON report. Only present when `json` option is set. */
  report?: DoctorReport;
  /** Top fixes to raise score (when `score` or `json`). */
  actionItems?: string[];
}

export interface DoctorReport {
  version: string;
  timestamp: string;
  project: string;
  score: number;
  checks: {
    id: string;
    name: string;
    level: Diagnostic["level"];
    message: string;
  }[];
  summary: {
    errors: number;
    warnings: number;
    passed: number;
    total: number;
  };
  /** 24 tactics from goals.md (R-05). Present when --json or --score. */
  tactics?: TacticResult[];
  tacticsScore?: number;
  /** Top actionable fixes (warn/error checks), highest impact first. */
  actionItems?: string[];
}

export interface DoctorOptions {
  cwd?: string;
  silent?: boolean;
  /** Compute and include an AI-readiness score (0–100). */
  score?: boolean;
  /** Emit a machine-readable JSON report. */
  json?: boolean;
}

// Check IDs for the structured report.
const CHECK = {
  CONFIG: "config",
  SITE_NAME: "site-name",
  SITE_BASE_URL: "site-base-url",
  SITE_DESCRIPTION: "site-description",
  ACTIONS_LOAD: "actions-load",
  ACTIONS_PUBLIC: "actions-public",
  ACTIONS_WHEN_TO_USE: "actions-when-to-use",
  BUILD_GRAPH: "build-graph",
  BUILD_OPENAPI: "build-openapi",
  ROUTE_STUBS: "route-stubs",
  NEXT_CONFIG: "next-config",
  BUILD_SCRIPT: "build-script",
  ROBOTS_AI_BOTS: "robots-ai-bots",
  ROBOTS_STRATEGY: "robots-strategy",
  NOAI_META: "noai-meta",
  JSON_LD: "json-ld",
  GRAPH_UPDATED_AT: "graph-updated-at",
  GRAPH_AUTHOR: "graph-author",
  MCP_TOKEN: "mcp-token",
} as const;

/**
 * Pre-flight checks for a next-ai-ready project. Catches the mistakes that
 * silently degrade AI-readiness — missing `whenToUse` (hurts tool selection),
 * an un-built graph (404s on `/llms.txt`), forgotten route stubs, etc.
 *
 * Returns structured diagnostics; the CLI prints them and exits non-zero if
 * any are `error`-level. Designed to run in CI (`next-ai-ready doctor`).
 */
export async function runDoctor(opts: DoctorOptions = {}): Promise<DoctorResult> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const diagnostics: Diagnostic[] = [];
  const checks: DoctorReport["checks"] = [];
  const add = (
    id: string,
    level: Diagnostic["level"],
    message: string,
    name: string,
  ) => {
    diagnostics.push({ level, message });
    checks.push({ id, name, level, message });
  };

  // 1. Config presence + required fields.
  const config = await loadConfig(cwd);
  if (!config) {
    add(CHECK.CONFIG, "error", "No ai-ready.config.mjs found. Run `next-ai-ready init`.", "Config presence");
    return finalize(diagnostics, checks, opts, config);
  }
  add(CHECK.CONFIG, "ok", "Found ai-ready.config.mjs", "Config presence");

  if (!config.site?.name) {
    add(CHECK.SITE_NAME, "error", "config.site.name is required.", "Site name");
  } else {
    add(CHECK.SITE_NAME, "ok", `Site name: "${config.site.name}"`, "Site name");
  }

  if (!config.site?.baseUrl) {
    add(CHECK.SITE_BASE_URL, "error", "config.site.baseUrl is required (used for citeUrl + OpenAPI servers).", "Base URL");
  } else if (!/^https?:\/\//.test(config.site.baseUrl)) {
    add(CHECK.SITE_BASE_URL, "error", `config.site.baseUrl must be an absolute URL, got "${config.site.baseUrl}".`, "Base URL");
  } else if (config.site.baseUrl.endsWith("/")) {
    add(CHECK.SITE_BASE_URL, "warn", "config.site.baseUrl has a trailing slash; it will be stripped.", "Base URL");
  } else {
    add(CHECK.SITE_BASE_URL, "ok", `Base URL: ${config.site.baseUrl}`, "Base URL");
  }

  if (!config.site?.description) {
    add(CHECK.SITE_DESCRIPTION, "warn", "config.site.description is empty — it improves AI search snippets.", "Site description");
  } else {
    add(CHECK.SITE_DESCRIPTION, "ok", "Site description present.", "Site description");
  }

  // 2. Actions: load + validate exposure rules (ADR-010).
  if (config.actions) {
    try {
      clearRegistry();
      if (Array.isArray(config.actions)) {
        registerActions(config.actions);
      } else if (typeof config.actions === "string") {
        const mod = (await import(pathToFileURL(resolve(cwd, config.actions)).href)) as {
          default?: unknown;
        };
        if (Array.isArray(mod.default) && listActions().length === 0) {
          registerActions(mod.default);
        }
      }
      const manifest = buildActionsManifest();
      add(CHECK.ACTIONS_LOAD, "ok", `Loaded ${manifest.actions.length} action(s)`, "Actions loaded");

      const publicActions = manifest.actions.filter((a) => a.public);
      add(
        CHECK.ACTIONS_PUBLIC,
        publicActions.length > 0 ? "ok" : "warn",
        `${publicActions.length} action(s) are public (exposed to AI).`,
        "Public actions",
      );
      for (const a of publicActions) {
        if (!a.whenToUse) {
          add(
            CHECK.ACTIONS_WHEN_TO_USE,
            "warn",
            `Action "${a.name}" is public but has no whenToUse — AI tool selection will suffer (ADR-010).`,
            `whenToUse: ${a.name}`,
          );
        }
      }
    } catch (err) {
      add(CHECK.ACTIONS_LOAD, "error", `Failed to load actions: ${err instanceof Error ? err.message : String(err)}`, "Actions load");
    }
  } else {
    add(CHECK.ACTIONS_LOAD, "warn", "No actions configured — Capability plane is empty (Knowledge-only site).", "Actions configured");
  }

  // 3. Build artifacts.
  if (await fileExists(graphPath(cwd))) {
    add(CHECK.BUILD_GRAPH, "ok", "Build artifact .next-ai-ready/graph.json present.", "Graph artifact");
  } else {
    add(CHECK.BUILD_GRAPH, "warn", "No graph.json yet. Run `next-ai-ready build` before deploying.", "Graph artifact");
  }

  if (await fileExists(publicOpenApiPath(cwd))) {
    add(CHECK.BUILD_OPENAPI, "ok", "Canonical artifact public/openapi.json present.", "OpenAPI artifact");
  } else {
    add(CHECK.BUILD_OPENAPI, "warn", "No public/openapi.json yet. Run `next-ai-ready build` before deploying.", "OpenAPI artifact");
  }

  // 4. Route stubs (the codemod output). Missing → endpoints 404.
  const requiredRoutes = [
    ROUTE_STUBS.LLMS_TXT,
    ROUTE_STUBS.PAGE_MD,
  ];
  const missingRoutes: string[] = [];
  for (const rel of requiredRoutes) {
    if (!(await fileExists(join(cwd, rel)))) {
      missingRoutes.push(rel);
    }
  }
  if (missingRoutes.length === 0) {
    add(CHECK.ROUTE_STUBS, "ok", "All required route stubs present.", "Route stubs");
  } else {
    add(
      CHECK.ROUTE_STUBS,
      "warn",
      `Missing route stub(s): ${missingRoutes.join(", ")} — run \`next-ai-ready init\`.`,
      "Route stubs",
    );
  }

  // 5. U-05: next.config contains withAiReady().
  const nextConfigContent = await readNextConfig(cwd);
  if (nextConfigContent !== null) {
    if (nextConfigContent.includes("withAiReady")) {
      add(CHECK.NEXT_CONFIG, "ok", "next.config includes withAiReady().", "Next config");
    } else {
      add(
        CHECK.NEXT_CONFIG,
        "warn",
        "next.config does not include withAiReady() — AI URL rewrites and file tracing will be missing.",
        "Next config",
      );
    }
  } else {
    add(CHECK.NEXT_CONFIG, "warn", "No next.config.{mjs,js,ts} found.", "Next config");
  }

  // 6. Build script check: package.json build/prebuild contains "next-ai-ready build".
  const pkgJson = await readPackageJson(cwd);
  if (pkgJson) {
    const buildCmd = pkgJson.scripts?.build ?? "";
    const prebuildCmd = pkgJson.scripts?.prebuild ?? "";
    if (buildCmd.includes("next-ai-ready build") || prebuildCmd.includes("next-ai-ready build")) {
      add(CHECK.BUILD_SCRIPT, "ok", "package.json build script includes next-ai-ready build.", "Build script");
    } else {
      add(
        CHECK.BUILD_SCRIPT,
        "warn",
        'package.json build script does not include "next-ai-ready build" — AI artifacts won\'t be emitted on deploy.',
        "Build script",
      );
    }
  } else {
    add(CHECK.BUILD_SCRIPT, "warn", "No package.json found.", "Build script");
  }

  // 7. T-03: robots.txt allows AI bots.
  const emitStaticRobots = config.emit?.robots !== false;
  const hasAppRobots =
    (await fileExists(join(cwd, "app", "robots.ts"))) ||
    (await fileExists(join(cwd, "app", "robots.js")));
  const robotsTxt = await readTextFile(publicRobotsTxtPath(cwd));
  if (robotsTxt !== null) {
    const knownBotIds = AI_BOTS.map((b) => b.id);
    const blockedBots = knownBotIds.filter(
      (id) => robotsTxt.includes(`User-agent: ${id}`) && robotsTxt.includes("Disallow: /"),
    );
    if (blockedBots.length === 0) {
      add(CHECK.ROBOTS_AI_BOTS, "ok", "robots.txt allows all known AI bots.", "Robots AI policy");
    } else {
      add(
        CHECK.ROBOTS_AI_BOTS,
        "warn",
        `robots.txt blocks ${blockedBots.length} AI bot(s): ${blockedBots.join(", ")}. This may reduce AI discoverability.`,
        "Robots AI policy",
      );
    }
  } else if (hasAppRobots && !emitStaticRobots) {
    add(
      CHECK.ROBOTS_AI_BOTS,
      "ok",
      "Using app/robots.ts with emit.robots: false — static public/robots.txt is not required.",
      "Robots AI policy",
    );
  } else if (hasAppRobots) {
    add(
      CHECK.ROBOTS_AI_BOTS,
      "ok",
      "Using app/robots.ts for robots policy at runtime (no static public/robots.txt).",
      "Robots AI policy",
    );
  } else {
    add(CHECK.ROBOTS_AI_BOTS, "warn", "No public/robots.txt found. Run `next-ai-ready build`.", "Robots AI policy");
  }

  // 7b. N-04: static public/robots.txt vs dynamic app/robots.ts.
  if (hasAppRobots && robotsTxt !== null) {
    add(
      CHECK.ROBOTS_STRATEGY,
      "warn",
      "Both app/robots.ts and public/robots.txt exist. Next.js serves app/robots.ts at runtime — use aiRobots() or remove the static file to avoid conflicting policies.",
      "Robots strategy",
    );
  } else if (hasAppRobots) {
    add(
      CHECK.ROBOTS_STRATEGY,
      "ok",
      "Using app/robots.ts for dynamic robots policy (recommended with aiRobots()).",
      "Robots strategy",
    );
  }

  // 7c. T-02: pages marked noai block AI crawlers.
  const noAiPages = await findNoAiPages(cwd, config.content ?? []);
  if (noAiPages.length > 0) {
    const sample = noAiPages.slice(0, 3).join(", ");
    const more = noAiPages.length > 3 ? ` (+${noAiPages.length - 3} more)` : "";
    add(
      CHECK.NOAI_META,
      "warn",
      `${noAiPages.length} page(s) declare noai (blocks AI crawlers): ${sample}${more}.`,
      "noai meta",
    );
  } else {
    add(CHECK.NOAI_META, "ok", "No noai meta tags found in content or app routes.", "noai meta");
  }

  // 8. R-01: MCP token configured for production.
  if (!process.env.NEXT_AI_READY_MCP_TOKEN) {
    add(
      CHECK.MCP_TOKEN,
      "warn",
      "NEXT_AI_READY_MCP_TOKEN is not set. The MCP HTTP endpoint will be unauthenticated in production.",
      "MCP token",
    );
  } else {
    add(CHECK.MCP_TOKEN, "ok", "NEXT_AI_READY_MCP_TOKEN is configured.", "MCP token");
  }

  // 9. T-01 / T-06: Graph metadata quality (updatedAt, author).
  const graphRaw = await readTextFile(graphPath(cwd));
  if (graphRaw !== null) {
    try {
      const graph = JSON.parse(graphRaw) as {
        routes?: Record<string, string>;
        nodes?: Record<string, { kind?: string; updatedAt?: string; author?: { name: string } }>;
      };
      const pageNodeIds = Object.values(graph.routes ?? {});
      const pageNodes = pageNodeIds
        .map((id) => graph.nodes?.[id])
        .filter((n): n is NonNullable<typeof n> => n?.kind === "page");

      if (pageNodes.length > 0) {
        const withUpdatedAt = pageNodes.filter((n) => n.updatedAt).length;
        const withAuthor = pageNodes.filter((n) => n.author?.name).length;
        const pctUpdated = Math.round((withUpdatedAt / pageNodes.length) * 100);
        const pctAuthor = Math.round((withAuthor / pageNodes.length) * 100);

        if (pctUpdated === 100) {
          add(CHECK.GRAPH_UPDATED_AT, "ok", `All ${pageNodes.length} pages have updatedAt.`, "Page updatedAt");
        } else if (pctUpdated > 0) {
          add(
            CHECK.GRAPH_UPDATED_AT,
            "warn",
            `${withUpdatedAt}/${pageNodes.length} pages (${pctUpdated}%) have updatedAt — missing pages reduce AI freshness signals (K6).`,
            "Page updatedAt",
          );
        } else {
          add(
            CHECK.GRAPH_UPDATED_AT,
            "warn",
            `No pages have updatedAt — add it to frontmatter for better AI freshness signals (K6).`,
            "Page updatedAt",
          );
        }

        if (pctAuthor === 100) {
          add(CHECK.GRAPH_AUTHOR, "ok", `All ${pageNodes.length} pages have author.`, "Page author");
        } else if (pctAuthor > 0) {
          add(
            CHECK.GRAPH_AUTHOR,
            "warn",
            `${withAuthor}/${pageNodes.length} pages (${pctAuthor}%) have author — missing author reduces E-E-A-T signals (K6).`,
            "Page author",
          );
        } else {
          add(
            CHECK.GRAPH_AUTHOR,
            "warn",
            "No pages have author — add it to frontmatter for better E-E-A-T signals (K6).",
            "Page author",
          );
        }

        // T-02: JSON-LD helpers in app routes (R-03).
        const usesJsonLd = await appUsesJsonLd(cwd);
        if (usesJsonLd) {
          add(
            CHECK.JSON_LD,
            "ok",
            "App routes reference JSON-LD helpers (getPageJsonLd / pageJsonLd).",
            "JSON-LD",
          );
        } else if (pageNodes.length > 0) {
          add(
            CHECK.JSON_LD,
            "warn",
            `${pageNodes.length} graph page(s) but no getPageJsonLd() / pageJsonLd usage in app/. Add structured data for AI search (K10).`,
            "JSON-LD",
          );
        }
      }
    } catch {
      // graph.json is malformed — the build-graph check already warns.
    }
  }

  let tacticResults: TacticResult[] | undefined;
  let tacticScore: number | undefined;
  if (opts.score || opts.json) {
    tacticResults = await evaluateTactics({ cwd, config, graphRaw });
    tacticScore = tacticsScore(tacticResults);
  }

  return finalize(diagnostics, checks, opts, config, tacticResults, tacticScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a 0–100 AI-readiness score. Each check contributes a weighted
 * portion; errors and warnings reduce the score.
 */
function computeScore(checks: DoctorReport["checks"]): number {
  if (checks.length === 0) return 0;

  // Weights: errors are 2× penalty, warnings are 1×.
  let totalWeight = 0;
  let penalty = 0;

  for (const c of checks) {
    const w = weight(c.id);
    totalWeight += w;
    if (c.level === "error") penalty += w * 2;
    else if (c.level === "warn") penalty += w;
  }

  if (totalWeight === 0) return 100;
  const raw = ((totalWeight - penalty) / totalWeight) * 100;
  return Math.max(0, Math.round(raw));
}

function weight(checkId: string): number {
  switch (checkId) {
    case CHECK.CONFIG:
    case CHECK.SITE_NAME:
    case CHECK.SITE_BASE_URL:
      return 10; // Critical
    case CHECK.SITE_DESCRIPTION:
      return 3;
    case CHECK.ACTIONS_LOAD:
      return 8;
    case CHECK.ACTIONS_PUBLIC:
      return 5;
    case CHECK.ACTIONS_WHEN_TO_USE:
      return 3;
    case CHECK.BUILD_GRAPH:
      return 8;
    case CHECK.BUILD_OPENAPI:
      return 5;
    case CHECK.ROUTE_STUBS:
      return 8;
    case CHECK.NEXT_CONFIG:
      return 8;
    case CHECK.BUILD_SCRIPT:
      return 8;
    case CHECK.ROBOTS_AI_BOTS:
    case CHECK.ROBOTS_STRATEGY:
      return 5;
    case CHECK.NOAI_META:
      return 6;
    case CHECK.JSON_LD:
      return 4;
    case CHECK.GRAPH_UPDATED_AT:
      return 3;
    case CHECK.GRAPH_AUTHOR:
      return 2;
    case CHECK.MCP_TOKEN:
      return 4;
    default:
      return 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Finalize + helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Actionable fix hints keyed by check id (warn/error only). */
const CHECK_FIXES: Partial<Record<string, string>> = {
  [CHECK.CONFIG]: "Run `npx next-ai-ready init` to create ai-ready.config.mjs and route stubs.",
  [CHECK.SITE_NAME]: "Set `site.name` in ai-ready.config.mjs.",
  [CHECK.SITE_BASE_URL]: "Set `site.baseUrl` to your production URL (no trailing slash).",
  [CHECK.SITE_DESCRIPTION]: "Add `site.description` — used in llms.txt and OpenAPI metadata.",
  [CHECK.ACTIONS_LOAD]: "Fix `actions` path in config or register at least one `defineAction`.",
  [CHECK.ACTIONS_PUBLIC]: "Set `public: true` only on actions you intend agents to call.",
  [CHECK.ACTIONS_WHEN_TO_USE]: "Add `whenToUse` to every public action so agents pick the right tool.",
  [CHECK.BUILD_GRAPH]: "Run `npx next-ai-ready build` before deploy.",
  [CHECK.BUILD_OPENAPI]: "Run `npx next-ai-ready build` to emit openapi.json.",
  [CHECK.ROUTE_STUBS]: "Run `npx next-ai-ready init` to scaffold app/_ai-ready handler stubs.",
  [CHECK.NEXT_CONFIG]: "Wrap next.config with `withAiReady()` from next-ai-ready (or @next-ai-ready/next).",
  [CHECK.BUILD_SCRIPT]: 'Add `"prebuild": "next-ai-ready build"` (or include build in `build` script).',
  [CHECK.ROBOTS_AI_BOTS]:
    "Run `next-ai-ready build`, or use `app/robots.ts` + `aiRobots()` and set `emit.robots: false`.",
  [CHECK.ROBOTS_STRATEGY]:
    "Remove `public/robots.txt` when using `app/robots.ts`, or set `emit.robots: false` in config.",
  [CHECK.NOAI_META]: "Remove `noai: true` from pages you want AI crawlers to index.",
  [CHECK.JSON_LD]: "Inject JSON-LD via `getPageJsonLd()` / `getSiteJsonLd()` in your layout or doc pages.",
  [CHECK.GRAPH_UPDATED_AT]: "Add `updatedAt` to MDX frontmatter for fresher citations.",
  [CHECK.GRAPH_AUTHOR]: "Add `author` to MDX frontmatter for E-E-A-T signals.",
  [CHECK.MCP_TOKEN]: "Set `NEXT_AI_READY_MCP_TOKEN` in production to protect `/api/mcp`.",
};

function buildActionItems(checks: DoctorReport["checks"], limit = 3): string[] {
  const items: string[] = [];
  const seen = new Set<string>();
  const ranked = checks
    .filter((c) => c.level === "error" || c.level === "warn")
    .sort((a, b) => {
      const levelOrder = { error: 0, warn: 1, ok: 2 };
      const ld = levelOrder[a.level] - levelOrder[b.level];
      if (ld !== 0) return ld;
      return weight(b.id) - weight(a.id);
    });

  for (const c of ranked) {
    const fix = CHECK_FIXES[c.id];
    if (!fix || seen.has(fix)) continue;
    seen.add(fix);
    items.push(fix);
    if (items.length >= limit) break;
  }
  return items;
}

function finalize(
  diagnostics: Diagnostic[],
  checks: DoctorReport["checks"],
  opts: DoctorOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any,
  tactics?: TacticResult[],
  tacticsScoreValue?: number,
): DoctorResult {
  const score = opts.score || opts.json ? computeScore(checks) : undefined;
  const actionItems =
    opts.score || opts.json ? buildActionItems(checks) : undefined;
  const report: DoctorReport | undefined = opts.json
    ? {
        version: "1",
        timestamp: new Date().toISOString(),
        project: config?.site?.name ?? "unknown",
        score: score ?? 0,
        checks,
        summary: {
          errors: diagnostics.filter((d) => d.level === "error").length,
          warnings: diagnostics.filter((d) => d.level === "warn").length,
          passed: diagnostics.filter((d) => d.level === "ok").length,
          total: diagnostics.length,
        },
        tactics,
        tacticsScore: tacticsScoreValue,
        actionItems,
      }
    : undefined;

  return {
    diagnostics,
    errors: diagnostics.filter((d) => d.level === "error").length,
    warnings: diagnostics.filter((d) => d.level === "warn").length,
    score,
    report,
    actionItems,
  };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function readTextFile(p: string): Promise<string | null> {
  try {
    return await readFile(p, "utf8");
  } catch {
    return null;
  }
}

async function readNextConfig(cwd: string): Promise<string | null> {
  for (const name of ["next.config.mjs", "next.config.js", "next.config.ts"]) {
    const content = await readTextFile(join(cwd, name));
    if (content !== null) return content;
  }
  return null;
}

/** T-02 — detect noai in frontmatter, HTML meta, or Next metadata exports. */
const NOAI_PATTERN =
  /(?:^---[\s\S]*?\nnoai:\s*true[\s\S]*?---)|(?:name=['"]robots['"][^>]*content=['"][^'"]*noai)|(?:robots:\s*\{[^}]*noai\s*:\s*true)|(?:\bnoai\s*:\s*true\b)/i;

const JSONLD_PATTERN = /getPageJsonLd|getSiteJsonLd|pageJsonLd|siteJsonLd|application\/ld\+json/i;

async function findNoAiPages(cwd: string, contentPatterns: string[]): Promise<string[]> {
  const patterns = [...contentPatterns, "app/**/*.{tsx,jsx}"];
  const files = await scanContent({ cwd, patterns }).catch(() => []);
  const hits: string[] = [];
  for (const file of files) {
    const text = await readTextFile(file.absPath);
    if (text && NOAI_PATTERN.test(text)) hits.push(file.relPath);
  }
  return hits;
}

async function appUsesJsonLd(cwd: string): Promise<boolean> {
  const files = await scanContent({ cwd, patterns: ["app/**/*.{tsx,jsx,ts,js}"] }).catch(() => []);
  for (const file of files) {
    const text = await readTextFile(file.absPath);
    if (text && JSONLD_PATTERN.test(text)) return true;
  }
  return false;
}

interface PackageJson {
  scripts?: Record<string, string>;
}

async function readPackageJson(cwd: string): Promise<PackageJson | null> {
  const raw = await readTextFile(join(cwd, "package.json"));
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}
