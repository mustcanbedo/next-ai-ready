import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildActionsManifest,
  clearRegistry,
  listActions,
  registerActions,
} from "@next-ai-ready/actions";
import { graphPath } from "../paths.js";
import { loadConfig } from "./load-config.js";

export interface Diagnostic {
  level: "error" | "warn" | "ok";
  message: string;
}

export interface DoctorResult {
  diagnostics: Diagnostic[];
  errors: number;
  warnings: number;
}

export interface DoctorOptions {
  cwd?: string;
  silent?: boolean;
}

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
  const add = (level: Diagnostic["level"], message: string) => diagnostics.push({ level, message });

  // 1. Config presence + required fields.
  const config = await loadConfig(cwd);
  if (!config) {
    add("error", "No ai-ready.config.mjs found. Run `next-ai-ready init`.");
    return finalize(diagnostics);
  }
  add("ok", "Found ai-ready.config.mjs");

  if (!config.site?.name) add("error", "config.site.name is required.");
  if (!config.site?.baseUrl) {
    add("error", "config.site.baseUrl is required (used for citeUrl + OpenAPI servers).");
  } else if (!/^https?:\/\//.test(config.site.baseUrl)) {
    add("error", `config.site.baseUrl must be an absolute URL, got "${config.site.baseUrl}".`);
  } else if (config.site.baseUrl.endsWith("/")) {
    add("warn", "config.site.baseUrl has a trailing slash; it will be stripped.");
  }
  if (!config.site?.description) {
    add("warn", "config.site.description is empty — it improves AI search snippets.");
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
      add("ok", `Loaded ${manifest.actions.length} action(s)`);

      const publicActions = manifest.actions.filter((a) => a.public);
      add(
        publicActions.length > 0 ? "ok" : "warn",
        `${publicActions.length} action(s) are public (exposed to AI).`,
      );
      for (const a of publicActions) {
        if (!a.whenToUse) {
          add("warn", `Action "${a.name}" is public but has no whenToUse — AI tool selection will suffer (ADR-010).`);
        }
      }
    } catch (err) {
      add("error", `Failed to load actions: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    add("warn", "No actions configured — Capability plane is empty (Knowledge-only site).");
  }

  // 3. Build artifacts.
  if (await fileExists(graphPath(cwd))) {
    add("ok", "Build artifact .next-ai-ready/graph.json present.");
  } else {
    add("warn", "No graph.json yet. Run `next-ai-ready build` before deploying.");
  }

  // 4. Route stubs (the codemod output). Missing → endpoints 404.
  const requiredRoutes = [
    "app/_ai-ready/llms-txt/route.ts",
    "app/_ai-ready/md/[...path]/route.ts",
  ];
  for (const rel of requiredRoutes) {
    if (!(await fileExists(join(cwd, rel)))) {
      add("warn", `Missing route stub ${rel} — run \`next-ai-ready init\`.`);
    }
  }

  return finalize(diagnostics);
}

function finalize(diagnostics: Diagnostic[]): DoctorResult {
  return {
    diagnostics,
    errors: diagnostics.filter((d) => d.level === "error").length,
    warnings: diagnostics.filter((d) => d.level === "warn").length,
  };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}
