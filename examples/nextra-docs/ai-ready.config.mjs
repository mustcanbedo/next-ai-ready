import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "Nextra AI-ready fixture",
    baseUrl: "https://nextra-fixture.example",
    description: "A tested Nextra 4 and next-ai-ready knowledge-plane integration.",
  },
  content: ["content/**/*.{md,mdx}"],
  llms: {
    sections: [
      { title: "Start here", include: "/*", priority: "high" },
    ],
  },
  semantic: {
    extract: { faq: true, entities: true },
  },
});
