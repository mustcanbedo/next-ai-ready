import { notFound } from "next/navigation";
import { getDoc, getAllDocs } from "@/lib/docs";
import { MdxContent } from "../../components/mdx-content";
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

export default async function DocPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const doc = await getDoc(slug.join("/"), locale as Locale);

  if (!doc) notFound();

  return (
    <article className="max-w-[740px]">
      <header className="mb-14 pb-8 border-b border-border/40">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/80">
          {doc.section.replace("-", " ")}
        </p>
        <h1 className="text-[2.5rem] font-bold tracking-tight text-text leading-[1.15]">
          {doc.title}
        </h1>
        {doc.summary && (
          <p className="mt-5 text-[17px] text-text-secondary leading-relaxed">
            {doc.summary}
          </p>
        )}
      </header>
      <MdxContent content={doc.content} />
    </article>
  );
}
