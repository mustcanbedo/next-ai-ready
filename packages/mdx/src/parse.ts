import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import matter from "gray-matter";

export interface ParsedFile {
  /** Strongly-typed (best-effort) frontmatter object. */
  frontmatter: Record<string, unknown>;
  /** Markdown body with frontmatter stripped. */
  body: string;
  /** mdast root for the body. */
  tree: Root;
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

/**
 * Parse an MDX/MD source file into frontmatter + mdast tree.
 *
 * Frontmatter is extracted with gray-matter (YAML) so we get a plain object;
 * the remaining body is parsed with `remark-parse` + `remark-mdx` + `remark-gfm`.
 */
export function parseMdx(source: string): ParsedFile {
  const { data, content } = matter(source);
  const tree = processor.parse(content) as Root;
  return { frontmatter: data ?? {}, body: content, tree };
}
