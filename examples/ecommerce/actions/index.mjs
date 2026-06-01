import { defineActions, defineAction } from "next-ai-ready";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PRODUCTS = [
  { id: "hoodie", name: "AI Hoodie", price: 49, tags: ["apparel"] },
  { id: "mug", name: "LLM Mug", price: 18, tags: ["merch"] },
  { id: "stickers", name: "Sticker Pack", price: 9, tags: ["merch"] },
];

export default defineActions([
  defineAction({
    name: "search_products",
    description: "Search the product catalog by keyword.",
    whenToUse: "User asks about products, pricing, or availability.",
    public: true,
    input: z.object({ q: z.string().min(1) }),
    output: z.object({
      results: z.array(z.object({ id: z.string(), name: z.string(), price: z.number() })),
    }),
    handler: async ({ q }) => {
      const needle = q.toLowerCase();
      const results = PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(needle) || p.tags.some((t) => t.includes(needle)),
      );
      return { results };
    },
  }),
  defineAction({
    name: "get_product_page",
    description: "Load Markdown content for a product page by route id.",
    whenToUse: "Agent needs full product detail from the knowledge plane.",
    public: true,
    input: z.object({ id: z.string() }),
    output: z.object({ markdown: z.string().nullable() }),
    handler: async ({ id }) => {
      try {
        const md = await readFile(join(process.cwd(), "content", "products", `${id}.mdx`), "utf8");
        return { markdown: md };
      } catch {
        return { markdown: null };
      }
    },
  }),
]);
