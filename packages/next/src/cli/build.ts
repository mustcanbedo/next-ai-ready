import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildRobotsTxt,
  scanContent,
  serializeStable,
  type AiReadyConfig,
  type ActionsManifest,
} from "@next-ai-ready/core";
import { compile } from "@next-ai-ready/mdx";
import { buildGraph } from "@next-ai-ready/semantic";
import { renderLlmsTxt, renderLlmsFullTxt } from "@next-ai-ready/llms";
import {
  buildActionsManifest,
  clearRegistry,
  listActions,
  registerActions,
} from "@next-ai-ready/actions";
import { buildOpenApi, buildToolsJson, buildAiPlugin } from "@next-ai-ready/openapi";
import {
  actionsManifestPath,
  graphPath,
  publicAiPluginPath,
  publicLlmsTxtPath,
  publicLlmsFullTxtPath,
  publicOpenApiPath,
  publicRobotsTxtPath,
  publicToolsJsonPath,
} from "../paths.js";
import { loadConfig } from "./load-config.js";

export interface BuildOptions {
  cwd?: string;
  /** Override config (skip loading from disk). */
  config?: AiReadyConfig;
  /** Suppress console output. */
  silent?: boolean;
}

export interface BuildResult {
  routes: number;
  actions: number;
  filesWritten: string[];
}

/**
 * Run the full Knowledge-plane build pipeline.
 *
 * 1. Load config (or accept inline `opts.config`).
 * 2. Scan filesystem for MD/MDX content.
 * 3. Compile each file → SemanticNode subtree.
 * 4. Assemble SemanticGraph.
 * 5. Write `.next-ai-ready/graph.json` + `public/llms.txt` + `public/llms-full.txt`.
 *
 * Pure and deterministic — same source tree + same config → byte-identical output.
 */
export async function runBuild(opts: BuildOptions = {}): Promise<BuildResult> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const log = (msg: string) => {
    if (!opts.silent) console.log(`[next-ai-ready] ${msg}`);
  };

  const config = opts.config ?? (await loadConfig(cwd));
  if (!config) {
    throw new Error(
      "No config found. Create `ai-ready.config.mjs` exporting a default AiReadyConfig object.",
    );
  }

  log(`scanning content (cwd=${cwd})`);
  const files = await scanContent({
    cwd,
    patterns: config.content,
  });
  log(`compiling ${files.length} files`);

  const pages = await Promise.all(
    files.map(async (f) => {
      const source = await readFile(f.absPath, "utf8");
      return compile({
        source,
        route: f.route,
        file: f.absPath,
        site: config.site,
        options: {
          ...(config.semantic?.chunk ? { chunk: config.semantic.chunk } : {}),
          ...(config.mdx?.components ? { components: config.mdx.components } : {}),
        },
      });
    }),
  );

  const graph = buildGraph({ site: config.site, pages });

  const written: string[] = [];

  // 1. graph.json (always — runtime handlers depend on it).
  const gPath = graphPath(cwd);
  await writeJson(gPath, graph);
  written.push(gPath);

  // 2. public/llms.txt (static-first; see ADR-011).
  if (config.emit?.llmsTxt !== false) {
    const path = publicLlmsTxtPath(cwd);
    await writeText(path, renderLlmsTxt(graph, { llms: config.llms }));
    written.push(path);
  }

  // 3. public/llms-full.txt.
  if (config.emit?.llmsFullTxt !== false) {
    const path = publicLlmsFullTxtPath(cwd);
    await writeText(path, renderLlmsFullTxt(graph));
    written.push(path);
  }

  // 4. public/robots.txt — explicit AI-crawler policy (see ADR-011 + robots.ts).
  if (config.emit?.robots !== false) {
    const path = publicRobotsTxtPath(cwd);
    await writeText(path, buildRobotsTxt(config.site, config.robots));
    written.push(path);
  }

  // ───────────────────────────── Capability plane ─────────────────────────────
  // Actions may be inlined or loaded from a module path. Either way we end up
  // with a populated registry; we then serialize it to a manifest and emit
  // OpenAPI / tools / ai-plugin artifacts. Skipped silently if the user has
  // no actions configured — Knowledge-plane-only sites are first-class.
  let manifest: ActionsManifest | null = null;
  if (config.actions) {
    clearRegistry();
    if (Array.isArray(config.actions)) {
      registerActions(config.actions);
    } else if (typeof config.actions === "string") {
      const modPath = resolve(cwd, config.actions);
      log(`loading actions from ${config.actions}`);
      // Dynamic import side-effect: the user's module may call
      // `defineActions([...])` at top level (registers as side-effect AND returns
      // the array). Only re-register the default export if the import did NOT
      // already populate the registry (i.e. the user used plain `defineAction`
      // without the `defineActions` wrapper).
      const mod = (await import(pathToFileURL(modPath).href)) as { default?: unknown };
      const defaultExport = mod.default;
      if (Array.isArray(defaultExport) && listActions().length === 0) {
        registerActions(defaultExport);
      }
    }
    manifest = buildActionsManifest();
    log(`compiled ${manifest.actions.length} actions`);

    const mPath = actionsManifestPath(cwd);
    await writeJson(mPath, manifest);
    written.push(mPath);

    if (config.emit?.openapi !== false) {
      const oPath = publicOpenApiPath(cwd);
      await writeJson(oPath, buildOpenApi(manifest, config.site));
      written.push(oPath);

      const tPath = publicToolsJsonPath(cwd);
      await writeJson(tPath, buildToolsJson(manifest, config.site));
      written.push(tPath);

      const pPath = publicAiPluginPath(cwd);
      await writeJson(pPath, buildAiPlugin(config.site));
      written.push(pPath);
    }
  }

  log(`wrote ${written.length} files`);
  return {
    routes: Object.keys(graph.routes).length,
    actions: manifest?.actions.length ?? 0,
    filesWritten: written,
  };
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, serializeStable(data), "utf8");
}

async function writeText(path: string, data: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data, "utf8");
}
