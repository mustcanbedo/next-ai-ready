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
export const SITE_DESCRIPTION =
  "AEO + Agent-API layer for Next.js App Router. Make your site readable by AI and callable by agents.";
