import type { Metadata } from "next";
import { locales, type Locale } from "./i18n";
import { getSiteBaseUrl, getSiteDescription, SITE_NAME } from "./site";

export function docPageMetadata(input: {
  locale: Locale;
  slug: string;
  title: string;
  summary?: string;
  updatedAt?: string;
  author?: string;
}): Metadata {
  const base = getSiteBaseUrl();
  const path = `/${input.locale}/docs/${input.slug}`;
  const url = `${base}${path}`;
  const description = input.summary || getSiteDescription(input.locale);

  const languages: Record<string, string> = {
    "x-default": `${base}/en/docs/${input.slug}`,
  };
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}/docs/${input.slug}`;
  }

  return {
    title: input.title,
    description,
    authors: input.author ? [{ name: input.author }] : undefined,
    creator: input.author,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: url,
      languages,
      types: {
        "text/markdown": `${url}.md`,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: `${input.title} — ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      locale: input.locale === "zh" ? "zh_CN" : "en_US",
      modifiedTime: input.updatedAt,
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
  const description = getSiteDescription(locale);

  const languages: Record<string, string> = {
    "x-default": `${base}/en`,
  };
  for (const loc of locales) {
    languages[loc] = `${base}/${loc}`;
  }

  return {
    title,
    description,
    applicationName: SITE_NAME,
    category: "developer tools",
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Graph route for a docs page (matches content/{locale}/docs/... scanner output). */
export function graphRoute(locale: Locale, slug: string): string {
  return `/${locale}/docs/${slug}`;
}
