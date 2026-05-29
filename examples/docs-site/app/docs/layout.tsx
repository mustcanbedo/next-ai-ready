import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { getAllDocs, groupBySection, SECTION_LABELS } from "@/lib/docs";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await getAllDocs();
  const groups = groupBySection(docs);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-6xl">
        <Sidebar groups={groups} sectionLabels={SECTION_LABELS} />
        <main className="flex-1 px-12 py-10">{children}</main>
      </div>
    </div>
  );
}
