import { toMarkdown } from "mdast-util-to-markdown";
import { gfmToMarkdown } from "mdast-util-gfm";
import type { Nodes, Root, RootContent } from "mdast";

export type ComponentMap = Record<string, (props: Record<string, unknown>) => string>;

/**
 * Render an mdast subtree to clean Markdown for AI consumption.
 *
 * MDX-specific nodes (`mdxJsxFlowElement`, `mdxJsxTextElement`, `mdxFlowExpression`,
 * `mdxTextExpression`, `mdxjsEsm`) are mapped through `components` (user-supplied)
 * or replaced with their text content. ESM imports/exports are dropped entirely
 * — they're meaningless to an LLM reading prose.
 *
 * The default behaviour is "lossy but readable": JSX becomes its children's
 * text. Users override per-component via `mdx.components` in their config.
 */
export function renderMarkdown(
  nodes: RootContent[] | Root,
  options: { components?: ComponentMap } = {},
): string {
  const tree: Root = Array.isArray(nodes)
    ? { type: "root", children: stripMdx(nodes, options.components ?? {}) }
    : { type: "root", children: stripMdx(nodes.children, options.components ?? {}) };

  return toMarkdown(tree as Nodes, {
    bullet: "-",
    fences: true,
    extensions: [gfmToMarkdown()],
  }).trim();
}

function stripMdx(children: RootContent[], components: ComponentMap): RootContent[] {
  const out: RootContent[] = [];
  for (const node of children) {
    const replaced = transform(node, components);
    if (replaced != null) out.push(replaced);
  }
  return out;
}

function transform(node: RootContent, components: ComponentMap): RootContent | null {
  switch (node.type) {
    // ESM blocks (`import`/`export`) are noise for LLMs.
    case "mdxjsEsm":
      return null;

    // Expressions like `{value}` — replace with a no-op placeholder text.
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return { type: "text", value: "" } as RootContent;

    // JSX elements — try user mapping first; otherwise inline children as text.
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement": {
      const name = (node as { name?: string }).name ?? "";
      const fn = components[name];
      if (fn) {
        const props = collectProps(node);
        return { type: "html", value: fn(props) } as RootContent;
      }
      // Default: hoist children up so their text survives.
      const kids = (node as { children?: RootContent[] }).children ?? [];
      return {
        type: "paragraph",
        children: kids.flatMap((c) => {
          const r = transform(c, components);
          return r ? [r] : [];
        }),
      } as RootContent;
    }

    default: {
      // Recurse into containers.
      const kids = (node as { children?: RootContent[] }).children;
      if (Array.isArray(kids)) {
        (node as { children: RootContent[] }).children = stripMdx(kids, components);
      }
      return node;
    }
  }
}

function collectProps(node: RootContent): Record<string, unknown> {
  const attrs = (node as { attributes?: Array<{ name?: string; value?: unknown }> }).attributes;
  if (!Array.isArray(attrs)) return {};
  const props: Record<string, unknown> = {};
  for (const a of attrs) {
    if (a.name) props[a.name] = a.value;
  }
  return props;
}
