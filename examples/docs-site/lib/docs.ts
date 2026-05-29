import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

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

const CONTENT_DIR = path.join(process.cwd(), "content/docs");

const SECTION_ORDER: Record<string, number> = {
  "getting-started": 0,
  concepts: 1,
  guides: 2,
  api: 3,
};

export async function getAllDocs(): Promise<DocMeta[]> {
  const docs: DocMeta[] = [];

  // Root-level docs
  const rootFiles = await fs.readdir(CONTENT_DIR);
  for (const file of rootFiles) {
    if (!file.endsWith(".mdx")) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
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
    const sectionDir = path.join(CONTENT_DIR, section);
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

export async function getDoc(slug: string): Promise<DocPage | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
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

export const SECTION_LABELS: Record<string, string> = {
  "getting-started": "Getting Started",
  concepts: "Concepts",
  guides: "Guides",
  api: "API Reference",
};
