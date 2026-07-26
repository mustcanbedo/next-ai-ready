import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildRobotsTxt,
  filesystemContentSource,
  serializeStable,
  type AiReadyConfig,
  type ActionsManifest,
  type SemanticProvider,
} from "@next-ai-ready/core";
import { compile } from "@next-ai-ready/mdx";
import { buildGraph } from "@next-ai-ready/semantic";
import { renderLlmsTxt, renderLlmsFullTxt, renderSitemapMarkdown } from "@next-ai-ready/llms";
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
  publicSitemapMdPath,
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
  const source = config.contentSource ?? filesystemContentSource();
  const entries = await source.scan({ cwd, patterns: config.content ?? ["app/**/*.{md,mdx}", "content/**/*.mdx"] });
  log(`compiling ${entries.length} files`);

  const pages = await Promise.all(
    entries.map(async (entry) => {
      const compiled = compile({
        source: entry.source,
        route: entry.route,
        file: entry.file,
        site: config.site,
        locale: entry.locale,
        options: {
          ...(config.semantic?.chunk ? { chunk: config.semantic.chunk } : {}),
          ...(config.mdx?.components ? { components: config.mdx.components } : {}),
        },
      });
      return compiled;
    }),
  );

  await applySemanticProvider(pages, config.semantic?.extract?.summary);
  await applyEmbeddings(pages, config.semantic?.embeddings?.provider);

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

  // 4. public/sitemap.md — compact canonical page directory for agents.
  if (config.emit?.sitemapMd !== false) {
    const path = publicSitemapMdPath(cwd);
    await writeText(path, renderSitemapMarkdown(graph));
    written.push(path);
  }

  // 5. public/robots.txt — explicit AI-crawler policy (see ADR-011 + robots.ts).
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
      await writeJson(tPath, buildToolsJson(manifest));
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

async function applySemanticProvider(
  pages: Awaited<ReturnType<typeof compile>>[],
  summaryConfig: "auto" | SemanticProvider | undefined,
): Promise<void> {
  if (!summaryConfig || summaryConfig === "auto") return;
  const provider = summaryConfig;
  for (const { page } of pages) {
    if (!page.body) continue;
    const input = { body: page.body, title: page.title, route: page.route };
    if (provider.summarize) {
      const s = await provider.summarize(input);
      if (s) page.summary = s;
    }
    if (provider.enrich) {
      const patch = await provider.enrich(input);
      Object.assign(page, patch);
    }
  }
}

async function applyEmbeddings(
  pages: Awaited<ReturnType<typeof compile>>[],
  provider: { embed(text: string): Promise<number[]> } | undefined,
): Promise<void> {
  if (!provider) return;
  for (const { children } of pages) {
    for (const node of children) {
      if (node.kind === "chunk" && node.embeddingHint) {
        node.embedding = await provider.embed(node.embeddingHint);
      }
    }
  }
}
