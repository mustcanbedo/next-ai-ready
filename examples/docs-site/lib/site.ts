/** Production site URL — used for metadata, sitemap, and Open Graph. */
export function getSiteBaseUrl(): string {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://next-ai-ready.vercel.app";
}

export const SITE_NAME = "next-ai-ready";

export const SITE_DESCRIPTIONS = {
  en: "Add llms.txt, page Markdown, JSON-LD, MCP, and authenticated agent actions to a Next.js App Router site.",
  zh: "为 Next.js App Router 站点添加 llms.txt、逐页 Markdown、JSON-LD、MCP 与经过鉴权的 Agent Action。",
} as const;

export const SITE_DESCRIPTION = SITE_DESCRIPTIONS.en;

export function getSiteDescription(locale: keyof typeof SITE_DESCRIPTIONS): string {
  return SITE_DESCRIPTIONS[locale];
}
