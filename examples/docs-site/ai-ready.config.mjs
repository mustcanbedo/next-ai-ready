import { defineConfig } from "@next-ai-ready/core";

export default defineConfig({
  site: {
    name: "next-ai-ready",
    baseUrl: "https://next-ai-ready.dev",
    description:
      "AEO + Agent-API layer for Next.js App Router. Make your site readable by AI and callable by agents.",
  },
  content: ["content/{en,zh}/**/*.mdx"],
  actions: "./actions/index.mjs",
});
