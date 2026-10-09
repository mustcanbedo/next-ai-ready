import { Header } from "../components/header";
import { notFound } from "next/navigation";
import { Sidebar } from "../components/sidebar";
import { getAllDocs, groupBySection } from "@/lib/docs";
import { getMessages } from "@/messages";
import { locales, type Locale } from "@/lib/i18n";

interface DocsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const t = getMessages(locale as Locale);
  const docs = await getAllDocs(locale as Locale);
  const groups = groupBySection(docs);

  return (
    <div className="min-h-screen">
      <Header locale={locale as Locale} messages={t.nav} docs={docs} />
      <div className="docs-shell">
        <Sidebar
          locale={locale as Locale}
          groups={groups}
          sectionLabels={t.docs.sidebar}
        />
        <main id="main-content" className="docs-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
