import type { MetadataRoute } from "next";
import { getAllDocs, type DocMeta } from "@/lib/docs";
import { locales, type Locale } from "@/lib/i18n";
import { getSiteBaseUrl } from "@/lib/site";

function toLastModified(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function latestDate(values: Array<string | undefined>): Date | undefined {
  return values
    .map(toLastModified)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const entries: MetadataRoute.Sitemap = [];
  const docsByLocale = new Map<Locale, DocMeta[]>();

  for (const locale of locales) {
    docsByLocale.set(locale, await getAllDocs(locale));
  }

  for (const locale of locales) {
    const docs = docsByLocale.get(locale) ?? [];
    entries.push({
      url: `${base}/${locale}`,
      lastModified: latestDate(docs.map((doc) => doc.updatedAt)),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "x-default": `${base}/en`,
          en: `${base}/en`,
          zh: `${base}/zh`,
        },
      },
    });

    for (const doc of docs) {
      const isIntro = doc.slug === "introduction";
      entries.push({
        url: `${base}/${locale}/docs/${doc.slug}`,
        lastModified: toLastModified(doc.updatedAt),
        changeFrequency: "weekly",
        priority: isIntro ? 0.9 : 0.7,
        alternates: {
          languages: {
            "x-default": `${base}/en/docs/${doc.slug}`,
            en: `${base}/en/docs/${doc.slug}`,
            zh: `${base}/zh/docs/${doc.slug}`,
          },
        },
      });
    }
  }

  const latestContentDate = latestDate(
    [...docsByLocale.values()].flatMap((docs) => docs.map((doc) => doc.updatedAt)),
  );
  for (const path of ["/llms.txt", "/llms-full.txt", "/openapi.json", "/tools.json"]) {
    entries.push({
      url: `${base}${path}`,
      lastModified: latestContentDate,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
