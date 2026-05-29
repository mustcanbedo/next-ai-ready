import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import fg from "fast-glob";

export interface ScannedFile {
  /** Absolute file path. */
  absPath: string;
  /** Path relative to `cwd`, POSIX separators. */
  relPath: string;
  /** Derived URL route. */
  route: string;
  /** File modified time (ms). */
  mtimeMs: number;
}

export interface ScanOptions {
  /** Working directory. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Glob patterns. Defaults to `["app/**\/*.{md,mdx}", "content/**\/*.mdx"]`. */
  patterns?: string[];
  /** Globs to ignore. */
  ignore?: string[];
}

const DEFAULT_PATTERNS = ["app/**/*.{md,mdx}", "content/**/*.mdx"];
const DEFAULT_IGNORE = ["**/node_modules/**", "**/.next/**", "**/dist/**"];

/**
 * Convert a content-relative file path into a URL route.
 *
 * Examples:
 *   app/docs/getting-started/page.mdx  → /docs/getting-started
 *   app/blog/(marketing)/hello/page.md → /blog/hello
 *   content/docs/install.mdx           → /docs/install
 *   content/index.mdx                  → /
 */
export function fileToRoute(relPath: string): string {
  const posix = relPath.split(sep).join("/");
  let parts = posix.split("/");

  // Drop the root content folder (`app` or `content`).
  if (parts[0] === "app" || parts[0] === "content") parts = parts.slice(1);

  // Drop trailing /page.{md,mdx} (App Router convention).
  const last = parts.at(-1);
  if (last === "page.mdx" || last === "page.md") {
    parts = parts.slice(0, -1);
  } else if (last && /\.mdx?$/.test(last)) {
    parts = [...parts.slice(0, -1), last.replace(/\.mdx?$/, "")];
  }

  // Drop App Router route groups `(group)` and private folders `_internal`.
  parts = parts.filter((p) => !p.startsWith("(") && !p.startsWith("_"));

  // `index` → root of its segment.
  if (parts.at(-1) === "index") parts = parts.slice(0, -1);

  const route = "/" + parts.join("/");
  return route === "/" ? "/" : route.replace(/\/+$/, "");
}

export async function scanContent(opts: ScanOptions = {}): Promise<ScannedFile[]> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const patterns = opts.patterns ?? DEFAULT_PATTERNS;
  const ignore = [...DEFAULT_IGNORE, ...(opts.ignore ?? [])];

  const matches = await fg(patterns, { cwd, ignore, absolute: false, dot: false });
  const files: ScannedFile[] = [];
  for (const rel of matches.sort()) {
    const absPath = join(cwd, rel);
    const st = await stat(absPath);
    files.push({
      absPath,
      relPath: rel,
      route: fileToRoute(rel),
      mtimeMs: st.mtimeMs,
    });
  }
  return files;
}
