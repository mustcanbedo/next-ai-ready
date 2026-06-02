import type { Metadata } from "next";
import { locales, type Locale } from "./i18n";
import { getSiteBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "./site";

export function docPageMetadata(input: {
  locale: Locale;
  slug: string;
  title: string;
  summary?: string;
}): Metadata {
  const base = getSiteBaseUrl();
  const path = `/${input.locale}/docs/${input.slug}`;
  const url = `${base}${path}`;
  const description = input.summary || SITE_DESCRIPTION;

  const languages: Record<string, string> = {
    "x-default": `${base}/en/docs/${input.slug}`,
  };
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}/docs/${input.slug}`;
  }

  return {
    title: input.title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: "article",
      url,
      title: `${input.title} — ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: input.locale === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} — ${SITE_NAME}`,
      description,
    },
  };
}

export function homeMetadata(locale: Locale): Metadata {
  const base = getSiteBaseUrl();
  const url = `${base}/${locale}`;
  const title =
    locale === "zh"
      ? "next-ai-ready — Next.js 的 AI 基础设施层"
      : "next-ai-ready — The AI Layer for Next.js";

  const languages: Record<string, string> = {
    "x-default": `${base}/en`,
  };
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}`;
  }

  return {
    title,
    description: SITE_DESCRIPTION,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      title,
      description: SITE_DESCRIPTION,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: SITE_DESCRIPTION,
    },
  };
}

/** Graph route for a docs page (matches content/{locale}/docs/... scanner output). */
export function graphRoute(locale: Locale, slug: string): string {
  return `/${locale}/docs/${slug}`;
}
