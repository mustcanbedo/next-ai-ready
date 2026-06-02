#!/usr/bin/env node
/**
 * Add `questions` and `tags` frontmatter to docs-site MDX pages for richer AI extraction.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import { fileURLToPath } from "node:url";

import { CURATED_FAQ } from "./faq-curated.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");

const TAGS_BY_SECTION = {
  "getting-started": ["next.js", "setup", "project-structure"],
  concepts: ["architecture", "knowledge-plane", "capability-plane"],
  guides: ["how-to", "best-practices"],
  "api-reference": ["api", "reference"],
  decisions: ["adr", "architecture"],
};

function defaultQuestions(title, summary, locale) {
  const topic = summary || title;
  if (locale === "zh") {
    return [
      { q: `${title} 是什么？`, a: topic },
      { q: `阅读「${title}」能解决什么问题？`, a: topic },
    ];
  }
  return [
    { q: `What is ${title}?`, a: topic },
    { q: `What will I learn from ${title}?`, a: topic },
  ];
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

async function main() {
  for (const locale of ["en", "zh"]) {
    const localeDir = path.join(CONTENT, locale, "docs");
    for (const file of await walk(localeDir)) {
      const raw = await fs.readFile(file, "utf8");
      const parsed = matter(raw);
      const data = parsed.data;
      let changed = false;

      const rel = path.relative(localeDir, file).replace(/\.mdx$/, "");
      const curated = CURATED_FAQ[locale]?.[rel];

      if (curated) {
        if (JSON.stringify(data.questions) !== JSON.stringify(curated)) {
          data.questions = curated;
          changed = true;
        }
      } else if (!data.questions) {
        data.questions = defaultQuestions(
          String(data.title ?? path.basename(file, ".mdx")),
          String(data.summary ?? ""),
          locale,
        );
        changed = true;
      }

      if (!data.tags) {
        const section = rel.includes("/") ? rel.split("/")[0] : "getting-started";
        data.tags = TAGS_BY_SECTION[section] ?? ["next-ai-ready", "documentation"];
        changed = true;
      }

      if (!data.updatedAt) {
        data.updatedAt = "2026-06-02";
        changed = true;
      }

      if (!data.author) {
        data.author = locale === "zh" ? "next-ai-ready 团队" : "next-ai-ready team";
        changed = true;
      }

      if (changed) {
        await fs.writeFile(file, matter.stringify(parsed.content, data));
        console.log("updated", path.relative(ROOT, file));
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
