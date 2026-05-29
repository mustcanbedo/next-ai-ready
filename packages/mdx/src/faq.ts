import type { SemanticFaq } from "@next-ai-ready/core";
import type { Section } from "./headings.js";
import { nodeToText } from "./text.js";

/**
 * Extract FAQ entries from:
 *   1. Explicit declarations in frontmatter or `semantic` export
 *      (`questions: [{ q, a }]` — highest signal).
 *   2. Heading-based heuristic: a heading that ends with "?" or starts
 *      with "Q:" — the immediately following paragraphs are the answer.
 *
 * Returns deduplicated entries; explicit entries win over extracted ones.
 */
export function extractFaq(input: {
  frontmatter: Record<string, unknown>;
  semantic?: { questions?: SemanticFaq[] };
  root: Section;
}): SemanticFaq[] {
  const out: SemanticFaq[] = [];
  const seen = new Set<string>();

  const push = (q: string, a: string) => {
    const qNorm = q.trim();
    const aNorm = a.trim();
    if (!qNorm || !aNorm || seen.has(qNorm)) return;
    seen.add(qNorm);
    out.push({ q: qNorm, a: aNorm });
  };

  // 1. Explicit (frontmatter / semantic export).
  const explicit = pickFaqArray(input.semantic?.questions) ?? pickFaqArray(input.frontmatter.questions);
  for (const entry of explicit ?? []) push(entry.q, entry.a);

  // 2. Heuristic: walk all sections.
  for (const section of flatten(input.root)) {
    const title = section.title.trim();
    if (!isQuestion(title)) continue;
    const answer = section.body.map((n) => nodeToText(n)).join(" ").trim();
    if (answer) push(normalizeQuestion(title), answer);
  }
  return out;
}

function flatten(s: Section): Section[] {
  const out: Section[] = [];
  const stack: Section[] = [s];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur.depth > 0) out.push(cur);
    for (const c of cur.children) stack.push(c);
  }
  return out;
}

function isQuestion(title: string): boolean {
  if (title.endsWith("?")) return true;
  return /^(Q[:.]\s)/i.test(title);
}

function normalizeQuestion(title: string): string {
  return title.replace(/^(Q[:.]\s*)/i, "").trim();
}

function pickFaqArray(v: unknown): SemanticFaq[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const result: SemanticFaq[] = [];
  for (const item of v) {
    if (item && typeof item === "object") {
      const q = (item as Record<string, unknown>).q;
      const a = (item as Record<string, unknown>).a;
      if (typeof q === "string" && typeof a === "string") result.push({ q, a });
    }
  }
  return result.length ? result : undefined;
}
