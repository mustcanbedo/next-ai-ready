import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { getSiteJsonLd } from "next-ai-ready/json-ld";
import { JsonLd } from "../components/json-ld";
import { locales, type Locale } from "@/lib/i18n";
import { getSiteBaseUrl, getSiteDescription, SITE_NAME } from "@/lib/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: value } = await params;
  const locale = locales.includes(value as Locale) ? (value as Locale) : "en";
  const description = getSiteDescription(locale);
  const defaultTitle =
    locale === "zh"
      ? "next-ai-ready — Next.js 的 AI 基础设施层"
      : "next-ai-ready — The AI Layer for Next.js";
  const verification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(getSiteBaseUrl()),
    title: { default: defaultTitle, template: "%s — next-ai-ready" },
    description,
    verification: verification ? { google: verification } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: defaultTitle,
      description,
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const siteJsonLd = await getSiteJsonLd();

  return (
    <html lang={locale} className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <JsonLd data={siteJsonLd} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
