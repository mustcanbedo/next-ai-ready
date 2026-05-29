import type { SemanticFaq, SemanticEntity } from "@next-ai-ready/core";

/**
 * Authoring helper for users to annotate route files with semantic metadata.
 *
 * ```ts
 * // app/docs/install/page.mdx
 * export const semantic = defineSemantic({
 *   summary: "Install Acme in 60 seconds.",
 *   topics: ["install"],
 *   questions: [{ q: "How do I install?", a: "Run `pnpm i acme`." }],
 * })
 * ```
 *
 * Identity at runtime; pure typing convenience. The compiler reads this
 * object and merges it with extracted heuristics.
 */
export interface SemanticAnnotation {
  summary?: string;
  topics?: string[];
  questions?: SemanticFaq[];
  entities?: SemanticEntity[];
}

export function defineSemantic(annotation: SemanticAnnotation): SemanticAnnotation {
  return annotation;
}
