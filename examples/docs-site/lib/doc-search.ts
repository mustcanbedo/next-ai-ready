import type { DocMeta } from "./docs";
import type { DocBlock } from "./doc-content";

interface SearchHeading {
  id: string;
  text: string;
}

interface SearchSection {
  heading?: SearchHeading;
  text: string;
}

export type DocSearchIndex = Record<string, SearchSection[]>;
type SearchResult = DocMeta & { heading?: SearchHeading };

export function indexDocSections(blocks: DocBlock[]): SearchSection[] {
  const sections: SearchSection[] = [{ text: "" }];
  let section = sections[0];
  for (const block of blocks) {
    if (block.type === "heading") {
      section = { heading: { id: block.id, text: block.content }, text: "" };
      sections.push(section);
    } else if (block.type === "code" || !block.content.startsWith("# ")) {
      const text = block.type === "code" ? block.content : block.content
        .replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/`|\*\*/g, "");
      section.text += ` ${text}`;
    }
  }
  return sections.map(({ text, ...rest }) => ({ ...rest, text: text.trim().replace(/\s+/g, " ") }));
}

export function searchDocs(docs: DocMeta[], query: string, index?: DocSearchIndex): SearchResult[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return docs.slice(0, 8);
  return docs.map((doc) => {
    const title = doc.title.toLocaleLowerCase();
    const slug = doc.slug.toLocaleLowerCase();
    const summary = doc.summary.toLocaleLowerCase();
    const weights = terms.map((term): number => {
      if (title.includes(term)) return 5;
      if (slug.includes(term)) return 4;
      if (summary.includes(term)) return 3;
      return 0;
    });
    if (weights.every(Boolean)) return { doc, score: weights.reduce((total, weight) => total + weight, 0) };

    let bestScore = 0;
    let bestHeading: SearchHeading | undefined;
    for (const section of index?.[doc.slug] ?? []) {
      const heading = section.heading?.text.toLocaleLowerCase() ?? "";
      const text = section.text.toLocaleLowerCase();
      const score = terms.reduce((total, term, i) => {
        if (total < 0) return total;
        const weight = weights[i] || (heading.includes(term) ? 2 : Number(text.includes(term)));
        return weight ? total + weight : -1;
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        bestHeading = section.heading;
      }
    }

    return { doc: bestHeading ? { ...doc, heading: bestHeading } : doc, score: bestScore };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ doc }) => doc);
}
