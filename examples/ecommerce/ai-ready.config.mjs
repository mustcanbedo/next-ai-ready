import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "Demo Shop",
    baseUrl: "https://shop.example.com",
    description: "Example e-commerce catalog for next-ai-ready agents.",
  },
  content: ["content/**/*.mdx"],
  actions: "./actions/index.mjs",
});
