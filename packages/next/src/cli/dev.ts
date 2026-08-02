import { resolve } from "node:path";
import chokidar from "chokidar";
import { loadConfig } from "./load-config.js";
import { runBuild } from "./build.js";
import { invalidateGraphCache } from "../runtime/graph-loader.js";
import { invalidateManifestCache } from "../runtime/manifest-loader.js";

export interface DevOptions {
  cwd?: string;
  silent?: boolean;
}

const DEFAULT_IGNORE = ["**/node_modules/**", "**/.next/**", "**/dist/**"];

/**
 * Watch content globs and rebuild AI artifacts on change (R-07).
 * Also invalidates in-process graph/manifest caches (N-11).
 */
export async function runDev(opts: DevOptions = {}): Promise<void> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const config = await loadConfig(cwd);
  if (!config) {
    throw new Error("[next-ai-ready] No ai-ready.config found. Run `next-ai-ready init` first.");
  }

  const log = (msg: string) => {
    if (!opts.silent) console.log(`[next-ai-ready] ${msg}`);
  };

  let building = false;
  let pending = false;

  const rebuild = async () => {
    if (building) {
      pending = true;
      return;
    }
    building = true;
    try {
      do {
        pending = false;
        invalidateGraphCache();
        invalidateManifestCache();
        const result = await runBuild({ cwd, silent: opts.silent });
        log(`rebuilt — ${result.routes} routes, ${result.actions} actions`);
      } while (pending);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[next-ai-ready] rebuild failed: ${message}`);
    } finally {
      building = false;
    }
  };

  await rebuild();

  const patterns = config.content ?? [
    "app/**/*.{md,mdx}",
    "content/**/*.{md,mdx}",
    "src/app/**/*.{md,mdx}",
    "src/content/**/*.{md,mdx}",
  ];
  const watcher = chokidar.watch(patterns, {
    cwd,
    ignored: DEFAULT_IGNORE,
    ignoreInitial: true,
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void rebuild(), 250);
  };

  watcher.on("add", schedule);
  watcher.on("change", schedule);
  watcher.on("unlink", schedule);

  log(`watching ${patterns.join(", ")} — Ctrl+C to stop`);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      clearTimeout(timer);
      watcher.close();
      log("stopped");
      resolve();
    });
  });
}
