import type { Root } from "mdast";
import { nodeToText } from "./text.js";

const MAX_SUMMARY_CHARS = 280;

/**
 * Derive a page summary by deterministic precedence (ADR-004):
 *   1. frontmatter.summary
 *   2. frontmatter.description
 *   3. `semantic.summary` (caller passes this in)
 *   4. First non-empty paragraph in the body, truncated.
 *
 * Returns `undefined` if nothing reasonable is available.
 */
export function deriveSummary(input: {
  frontmatter: Record<string, unknown>;
  semantic?: { summary?: string };
  tree: Root;
}): string | undefined {
  const { frontmatter, semantic, tree } = input;

  const fmSummary = pickString(frontmatter.summary);
  if (fmSummary) return fmSummary;

  const fmDesc = pickString(frontmatter.description);
  if (fmDesc) return fmDesc;

  if (semantic?.summary) return semantic.summary;

  for (const node of tree.children) {
    if (node.type !== "paragraph") continue;
    const text = nodeToText(node).trim();
    if (text.length > 0) return truncate(text, MAX_SUMMARY_CHARS);
  }
  return undefined;
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}
