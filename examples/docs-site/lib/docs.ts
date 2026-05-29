import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "./i18n";

export interface DocMeta {
  title: string;
  summary: string;
  slug: string;
  section: string;
  order: number;
}

export interface DocPage extends DocMeta {
  content: string;
}

function contentDir(locale: Locale) {
  return path.join(process.cwd(), "content/docs", locale);
}

const SECTION_ORDER: Record<string, number> = {
  "getting-started": 0,
  concepts: 1,
  guides: 2,
  api: 3,
};

export async function getAllDocs(locale: Locale = "en"): Promise<DocMeta[]> {
  const docs: DocMeta[] = [];
  const dir = contentDir(locale);

  // Root-level docs
  const rootFiles = await fs.readdir(dir);
  for (const file of rootFiles) {
    if (!file.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    const { data } = matter(raw);
    docs.push({
      title: data.title ?? file.replace(".mdx", ""),
      summary: data.summary ?? "",
      slug: file.replace(".mdx", ""),
      section: "getting-started",
      order: data.order ?? 99,
    });
  }

  // Section docs
  for (const section of Object.keys(SECTION_ORDER)) {
    const sectionDir = path.join(dir, section);
    try {
      const files = await fs.readdir(sectionDir);
      for (const file of files) {
        if (!file.endsWith(".mdx")) continue;
        const raw = await fs.readFile(
          path.join(sectionDir, file),
          "utf8",
        );
        const { data } = matter(raw);
        docs.push({
          title: data.title ?? file.replace(".mdx", ""),
          summary: data.summary ?? "",
          slug: `${section}/${file.replace(".mdx", "")}`,
          section,
          order: data.order ?? 99,
        });
      }
    } catch {
      // Section dir doesn't exist yet
    }
  }

  return docs.sort((a, b) => {
    const sA = SECTION_ORDER[a.section] ?? 99;
    const sB = SECTION_ORDER[b.section] ?? 99;
    if (sA !== sB) return sA - sB;
    return a.order - b.order;
  });
}

export async function getDoc(slug: string, locale: Locale = "en"): Promise<DocPage | null> {
  const filePath = path.join(contentDir(locale), `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    const section = slug.includes("/") ? slug.split("/")[0] : "getting-started";
    return {
      title: data.title ?? slug,
      summary: data.summary ?? "",
      slug,
      section,
      order: data.order ?? 99,
      content,
    };
  } catch {
    return null;
  }
}

export function groupBySection(docs: DocMeta[]): Record<string, DocMeta[]> {
  const groups: Record<string, DocMeta[]> = {};
  for (const doc of docs) {
    const section = doc.section;
    if (!groups[section]) groups[section] = [];
    groups[section].push(doc);
  }
  return groups;
}
