import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getPageJsonLd } from "next-ai-ready/json-ld";
import { JsonLd } from "../../../components/json-ld";
import { getDoc, getAllDocs } from "@/lib/docs";
import { MdxContent } from "../../components/mdx-content";
import { TableOfContents } from "../../components/toc";
import { locales, type Locale } from "@/lib/i18n";
import { docPageMetadata, graphRoute } from "@/lib/seo";
import { getMessages } from "@/messages";

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { locale: string; slug: string[] }[] = [];
  for (const locale of locales) {
    const docs = await getAllDocs(locale);
    for (const doc of docs) {
      params.push({ locale, slug: doc.slug.split("/") });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const doc = await getDoc(slug.join("/"), locale as Locale);
  if (!doc) return {};
  return docPageMetadata({
    locale: locale as Locale,
    slug: slug.join("/"),
    title: doc.title,
    summary: doc.summary,
    updatedAt: doc.updatedAt,
    author: doc.author,
  });
}

function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ id, text, level: match[1].length });
    }
  }
  return headings;
}

export default async function DocPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const doc = await getDoc(slug.join("/"), locale as Locale);

  if (!doc) notFound();

  const pageJsonLd = await getPageJsonLd(graphRoute(locale as Locale, doc.slug));

  const allDocs = await getAllDocs(locale as Locale);
  const currentIndex = allDocs.findIndex((d) => d.slug === doc.slug);
  const prev = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const next = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;
  const headings = extractHeadings(doc.content);
  const sectionLabels = getMessages(locale as Locale).docs.sidebar;
  const sectionLabel = sectionLabels[doc.section as keyof typeof sectionLabels] ?? doc.section;

  return (
    <div className="doc-grid">
      <JsonLd data={pageJsonLd} />
      <article className="doc-article">
        <header className="doc-header">
          <nav className="doc-breadcrumb" aria-label={locale === "zh" ? "面包屑导航" : "Breadcrumb"}>
            <Link href={`/${locale}/docs/introduction`}>{locale === "zh" ? "文档" : "Docs"}</Link>
            <ChevronRight aria-hidden="true" /><span>{sectionLabel}</span>
          </nav>
          <h1>
            {doc.title}
          </h1>
          {doc.summary && (
            <p className="doc-summary">
              {doc.summary}
            </p>
          )}
            <div className="doc-meta">
              {doc.author && <span>{doc.author}</span>}
              {doc.updatedAt && (
                <span>
                  {locale === "en" ? "Last updated: " : "最后更新："}
                  <time dateTime={doc.updatedAt}>{doc.updatedAt}</time>
                </span>
              )}
              <a href={`/${locale}/docs/${doc.slug}.md`}><FileText size={13} aria-hidden="true" />Markdown</a>
            </div>
        </header>
        {headings.length > 0 && <details className="mobile-toc"><summary>{locale === "zh" ? "本页目录" : "On this page"}</summary><ul>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ul></details>}
        <MdxContent content={doc.content} locale={locale as Locale} />

        {/* Prev / Next */}
        <nav className="doc-pagination" aria-label={locale === "zh" ? "相邻文档" : "Adjacent documentation"}>
          {prev ? (
            <Link
              href={`/${locale}/docs/${prev.slug}`}
              className="previous-page"
              prefetch={false}
            >
              <span className="page-label"><ArrowLeft size={13} aria-hidden="true" />
                {locale === "en" ? "Previous" : "上一篇"}
              </span>
              <span className="page-title">
                {prev.title}
              </span>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/${locale}/docs/${next.slug}`}
              className="next-page"
              prefetch={false}
            >
              <span className="page-label">
                {locale === "en" ? "Next" : "下一篇"}
                <ArrowRight size={13} aria-hidden="true" />
              </span>
              <span className="page-title">
                {next.title}
              </span>
            </Link>
          ) : <div />}
        </nav>
      </article>

      {/* Right-side Table of Contents */}
      {headings.length > 0 && (
        <TableOfContents headings={headings} locale={locale as Locale} />
      )}
    </div>
  );
}
