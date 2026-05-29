import type { Section } from "./headings.js";
import { renderMarkdown, type ComponentMap } from "./to-markdown.js";
import { estimateTokens } from "./text.js";

export interface Chunk {
  /** Stable index inside its parent page. */
  index: number;
  /** Path of section titles from root, joined with " > ". */
  breadcrumb: string;
  /** Slug of the heading this chunk belongs to (for anchor URLs). */
  slug: string;
  /** Chunk body, Markdown. */
  body: string;
  /** Estimated token count (see `text.ts`). */
  tokens: number;
}

export interface ChunkOptions {
  maxTokens?: number;
  /** Soft overlap target between adjacent chunks, in tokens. */
  overlap?: number;
  components?: ComponentMap;
}

const DEFAULT_MAX = 800;
const DEFAULT_OVERLAP = 80;

/**
 * Token-aware chunking that respects heading boundaries.
 *
 * Algorithm:
 *   1. Walk sections depth-first.
 *   2. For each section's body, render to Markdown, split into blocks.
 *   3. Accumulate blocks until adding the next one would exceed `maxTokens`;
 *      emit a chunk, then carry the tail (~`overlap` tokens) into the next
 *      chunk as overlap.
 *
 * Headings (their titles) are prepended to each chunk as a breadcrumb so
 * isolated chunks remain self-describing — a hard requirement for AI retrieval.
 */
export function chunkSections(root: Section, opts: ChunkOptions = {}): Chunk[] {
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX;
  const overlap = opts.overlap ?? DEFAULT_OVERLAP;
  const components = opts.components ?? {};

  const chunks: Chunk[] = [];
  let nextIndex = 0;

  function visit(section: Section, trail: string[]) {
    const breadcrumb = trail.filter(Boolean).join(" > ");
    if (section.body.length > 0) {
      const rendered = renderMarkdown(section.body, { components });
      const blocks = rendered.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

      let buf: string[] = [];
      let bufTokens = 0;

      const flush = (slug: string) => {
        if (buf.length === 0) return;
        const body = buf.join("\n\n");
        chunks.push({
          index: nextIndex++,
          breadcrumb,
          slug,
          body,
          tokens: estimateTokens(body),
        });
        // Carry an overlap tail into the next buffer.
        if (overlap > 0) {
          const tail: string[] = [];
          let tailTokens = 0;
          for (let i = buf.length - 1; i >= 0 && tailTokens < overlap; i--) {
            tail.unshift(buf[i]!);
            tailTokens += estimateTokens(buf[i]!);
          }
          buf = tail;
          bufTokens = tailTokens;
        } else {
          buf = [];
          bufTokens = 0;
        }
      };

      for (const block of blocks) {
        const t = estimateTokens(block);
        if (bufTokens + t > maxTokens && buf.length > 0) flush(section.slug);
        buf.push(block);
        bufTokens += t;
      }
      flush(section.slug);
    }

    for (const child of section.children) {
      visit(child, [...trail, child.title]);
    }
  }

  visit(root, []);
  return chunks;
}
