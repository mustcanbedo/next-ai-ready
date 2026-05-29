import type { Heading, Root, RootContent } from "mdast";
import GithubSlugger from "github-slugger";
import { nodeToText } from "./text.js";

export interface Section {
  /** Heading depth (1–6). The root pseudo-section is depth 0. */
  depth: number;
  /** Plain-text heading title. Empty string for the root pseudo-section. */
  title: string;
  /** URL-safe anchor slug. Empty for the root pseudo-section. */
  slug: string;
  /** Body nodes belonging to this section (before its first sub-heading). */
  body: RootContent[];
  children: Section[];
}

/**
 * Split a flat mdast tree into a nested section tree, assigning unique
 * URL-safe slugs to every heading.
 *
 * The returned root section has `depth: 0` and represents content above
 * the first heading; its `children` are the H1/H2/... sections.
 */
export function sectionize(tree: Root): Section {
  const slugger = new GithubSlugger();
  const root: Section = { depth: 0, title: "", slug: "", body: [], children: [] };
  const stack: Section[] = [root];

  for (const node of tree.children) {
    if (node.type === "heading") {
      const heading = node as Heading;
      const title = nodeToText(heading).trim();
      const slug = slugger.slug(title || `section-${heading.depth}`);
      const section: Section = {
        depth: heading.depth,
        title,
        slug,
        body: [],
        children: [],
      };
      // Pop until we find a strictly shallower parent.
      while (stack.length > 1 && stack[stack.length - 1]!.depth >= heading.depth) {
        stack.pop();
      }
      stack[stack.length - 1]!.children.push(section);
      stack.push(section);
    } else {
      stack[stack.length - 1]!.body.push(node);
    }
  }

  return root;
}
