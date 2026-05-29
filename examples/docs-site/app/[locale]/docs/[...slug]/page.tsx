import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoc, getAllDocs } from "@/lib/docs";
import { MdxContent } from "../../components/mdx-content";
import { TableOfContents } from "../../components/toc";
import { locales, type Locale } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

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
  return {
    title: doc.title,
    description: doc.summary,
  };
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

  const allDocs = await getAllDocs(locale as Locale);
  const currentIndex = allDocs.findIndex((d) => d.slug === doc.slug);
  const prev = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const next = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;
  const headings = extractHeadings(doc.content);

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1 max-w-[740px]">
        <header className="mb-14 pb-8 border-b border-white/[0.04]">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/70">
            {doc.section.replace("-", " ")}
          </p>
          <h1 className="text-[2.5rem] font-bold tracking-[-0.02em] text-text leading-[1.12]">
            {doc.title}
          </h1>
          {doc.summary && (
            <p className="mt-5 text-[17px] text-text-secondary/80 leading-relaxed">
              {doc.summary}
            </p>
          )}
        </header>
        <MdxContent content={doc.content} />

        {/* Prev / Next */}
        <nav className="mt-20 pt-8 border-t border-white/[0.04] grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/${locale}/docs/${prev.slug}`}
              className="group rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all"
            >
              <span className="text-[11px] uppercase tracking-widest text-text-tertiary/60 mb-2 block">
                {locale === "en" ? "Previous" : "上一篇"}
              </span>
              <span className="text-[14px] font-medium text-text group-hover:text-white transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={`/${locale}/docs/${next.slug}`}
              className="group rounded-xl border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all text-right"
            >
              <span className="text-[11px] uppercase tracking-widest text-text-tertiary/60 mb-2 block">
                {locale === "en" ? "Next" : "下一篇"}
              </span>
              <span className="text-[14px] font-medium text-text group-hover:text-white transition-colors">
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
