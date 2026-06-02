import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { locales } from "@/lib/i18n";
import { getSiteBaseUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${base}/${locale}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    });

    const docs = await getAllDocs(locale);
    for (const doc of docs) {
      const isIntro = doc.slug === "introduction";
      entries.push({
        url: `${base}/${locale}/docs/${doc.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: isIntro ? 0.9 : 0.7,
      });
    }
  }

  for (const path of ["/llms.txt", "/llms-full.txt", "/openapi.json", "/tools.json"]) {
    entries.push({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    });
  }

  return entries;
}
