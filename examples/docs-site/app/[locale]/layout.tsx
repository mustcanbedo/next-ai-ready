import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { getSiteJsonLd } from "next-ai-ready/json-ld";
import { JsonLd } from "../components/json-ld";
import { locales, type Locale } from "@/lib/i18n";
import { getSiteBaseUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  title: {
    default: "next-ai-ready — The AI Layer for Next.js",
    template: "%s — next-ai-ready",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "next-ai-ready — The AI Layer for Next.js",
    description: SITE_DESCRIPTION,
  },
};

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
