import { getAllDocs, getDoc } from "@/lib/docs";
import { parseDocBlocks } from "@/lib/doc-content";
import { indexDocSections } from "@/lib/doc-search";
import { isValidLocale, locales } from "@/lib/i18n";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return new Response(null, { status: 404 });
  const docs = await getAllDocs(locale);
  const entries = await Promise.all(docs.map(async ({ slug }) => {
    const doc = await getDoc(slug, locale);
    if (!doc) throw new Error(`Cannot index ${locale}/${slug}`);
    return [slug, indexDocSections(parseDocBlocks(doc.content))] as const;
  }));

  return Response.json(Object.fromEntries(entries), {
    headers: { "X-Robots-Tag": "noindex" },
  });
}
