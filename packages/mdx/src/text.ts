import type { Node, Parent } from "mdast";

/** Best-effort plain-text extraction from any mdast subtree. */
export function nodeToText(node: Node): string {
  // Leaf with `value` (text, code, inlineCode, html).
  const v = (node as { value?: unknown }).value;
  if (typeof v === "string") return v;
  const children = (node as Parent).children;
  if (!children) return "";
  return children.map(nodeToText).join("");
}

/**
 * Token estimator. We use the well-known `chars / 4` heuristic — fast,
 * dependency-free, accurate within ~15% for English/Markdown content.
 * Good enough for chunk-size decisions; not for billing.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
