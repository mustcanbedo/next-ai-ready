import { readFile } from "node:fs/promises";
import type { ContentScanEntry, ContentSource } from "./types.js";
import { scanContent } from "./scanner.js";
import { parseLocaleFromRoute } from "./locale.js";

/**
 * Register a custom content source adapter (P6-02).
 */
export function defineContentSource(source: ContentSource): ContentSource {
  return source;
}

/** Default filesystem adapter — wraps `scanContent()` + file reads. */
export function filesystemContentSource(): ContentSource {
  return defineContentSource({
    id: "filesystem",
    async scan({ cwd, patterns, ignore }) {
      const files = await scanContent({ cwd, patterns, ignore });
      const entries: ContentScanEntry[] = [];
      for (const f of files) {
        entries.push({
          route: f.route,
          source: await readFile(f.absPath, "utf8"),
          file: f.absPath,
          locale: parseLocaleFromRoute(f.route),
        });
      }
      return entries;
    },
  });
}
