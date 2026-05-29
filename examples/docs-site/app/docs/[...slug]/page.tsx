import { notFound } from "next/navigation";
import { getDoc, getAllDocs } from "@/lib/docs";
import { MdxContent } from "../../components/mdx-content";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const docs = await getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug.split("/"),
  }));
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
    <article className="max-w-[680px]">
      <header className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {doc.section.replace("-", " ")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-text">
          {doc.title}
        </h1>
        {doc.summary && (
          <p className="mt-3 text-base text-text-secondary leading-relaxed">
            {doc.summary}
          </p>
        )}
      </header>
      <div className="prose">
        <MdxContent content={doc.content} />
      </div>
    </article>
  );
}
