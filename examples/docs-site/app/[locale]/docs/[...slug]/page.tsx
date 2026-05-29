import { notFound } from "next/navigation";
import { getDoc, getAllDocs } from "@/lib/docs";
import { MdxContent } from "../../components/mdx-content";
import { locales } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export async function generateStaticParams() {
  const docs = await getAllDocs();
  const params: { locale: string; slug: string[] }[] = [];
  for (const locale of locales) {
    for (const doc of docs) {
      params.push({ locale, slug: doc.slug.split("/") });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDoc(slug.join("/"));
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.summary,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = await getDoc(slug.join("/"));

  if (!doc) notFound();

  return (
    <article className="max-w-[720px]">
      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
          {doc.section.replace("-", " ")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          {doc.title}
        </h1>
        {doc.summary && (
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            {doc.summary}
          </p>
        )}
      </header>
      <MdxContent content={doc.content} />
    </article>
  );
}
