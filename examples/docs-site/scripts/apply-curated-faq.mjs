#!/usr/bin/env node
/**
 * Apply curated FAQ frontmatter to all docs-site MDX pages.
 *
 *   node scripts/apply-curated-faq.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { fileURLToPath } from "node:url";
import { CURATED_FAQ } from "./faq-curated.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  let updated = 0;
  for (const locale of ["en", "zh"]) {
    const localeDir = path.join(ROOT, "content", locale, "docs");
    const map = CURATED_FAQ[locale];
    if (!map) continue;

    for (const [slug, questions] of Object.entries(map)) {
      const file = path.join(localeDir, `${slug}.mdx`);
      let raw;
      try {
        raw = await fs.readFile(file, "utf8");
      } catch {
        console.warn("skip missing", path.relative(ROOT, file));
        continue;
      }

      const parsed = matter(raw);
      parsed.data.questions = questions;
      await fs.writeFile(file, matter.stringify(parsed.content, parsed.data));
      updated++;
      console.log("faq", path.relative(ROOT, file));
    }
  }
  console.log(`\nApplied curated FAQ to ${updated} pages.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
