import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { getAllDocs, groupBySection } from "@/lib/docs";
import { getMessages } from "@/messages";
import type { Locale } from "@/lib/i18n";

interface DocsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const { locale } = await params;
  const t = getMessages(locale as Locale);
  const docs = await getAllDocs(locale as Locale);
  const groups = groupBySection(docs);

  return (
    <div className="min-h-screen">
      <Header locale={locale as Locale} messages={t.nav} />
      <div className="mx-auto flex max-w-[1400px] pt-16">
        <Sidebar
          locale={locale as Locale}
          groups={groups}
          sectionLabels={t.docs.sidebar}
        />
        <main className="flex-1 min-w-0 border-l border-border/50 px-16 py-14 lg:px-20">
          {children}
        </main>
      </div>
    </div>
  );
}
