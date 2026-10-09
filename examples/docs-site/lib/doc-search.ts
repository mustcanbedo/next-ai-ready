import type { DocMeta } from "./docs";

export function searchDocs(docs: DocMeta[], query: string): DocMeta[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return docs.slice(0, 8);
  return docs.map((doc) => {
    const title = doc.title.toLocaleLowerCase();
    const slug = doc.slug.toLocaleLowerCase();
    const summary = doc.summary.toLocaleLowerCase();
    const score = terms.reduce((total, term) => {
      if (total < 0) return total;
      if (title.includes(term)) return total + 3;
      if (slug.includes(term)) return total + 2;
      if (summary.includes(term)) return total + 1;
      return -1;
    }, 0);
    return { doc, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ doc }) => doc);
}
