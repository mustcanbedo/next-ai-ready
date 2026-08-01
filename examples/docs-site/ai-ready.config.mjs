import { defineConfig } from "next-ai-ready";

function siteBaseUrl() {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://next-ai-ready.vercel.app";
}

export default defineConfig({
  site: {
    name: "next-ai-ready",
    baseUrl: siteBaseUrl(),
    description:
      "AEO + Agent-API layer for Next.js App Router. Make your site readable by AI and callable by agents.",
    organization: {
      name: "next-ai-ready",
      url: siteBaseUrl(),
      logo: `${siteBaseUrl()}/icon.svg`,
    },
  },
  content: ["content/{en,zh}/**/*.mdx"],
  actions: "./actions/index.mjs",
  llms: {
    sections: [
      { title: "Home", include: "/*", priority: "high" },
      { title: "Introduction", include: "/**/docs/introduction", priority: "high" },
      { title: "Installation", include: "/**/docs/installation", priority: "high" },
      { title: "Project Structure", include: "/**/docs/getting-started/**", priority: "high" },
      { title: "Quickstart", include: "/**/docs/guides/quickstart", priority: "high" },
      { title: "Concepts", include: "/**/docs/concepts/**", priority: "high", limit: 8 },
      { title: "Guides", include: "/**/docs/guides/**" },
      { title: "API Reference", include: "/**/docs/api-reference/**" },
      { title: "Architecture", include: "/**/docs/decisions/**" },
    ],
  },
  semantic: {
    extract: { faq: true, entities: true },
  },
  emit: {
    robots: false,
  },
  robots: {
    aiBots: "allow",
    sitemap: true,
  },
});
