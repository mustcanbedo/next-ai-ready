"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocMeta } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";

interface SidebarProps {
  locale: Locale;
  groups: Record<string, DocMeta[]>;
  sectionLabels: Record<string, string>;
}

export function Sidebar({ locale, groups, sectionLabels }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0">
      <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-6">
        {Object.entries(groups).map(([section, docs]) => (
          <div key={section} className="mb-7">
            <h4 className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
              {sectionLabels[section] ?? section}
            </h4>
            <ul className="space-y-0.5">
              {docs.map((doc) => {
                const href = `/${locale}/docs/${doc.slug}`;
                const isActive = pathname === href;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={href}
                      className={`block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-bg-elevated text-text font-medium"
                          : "text-text-secondary hover:text-text hover:bg-bg-elevated/50"
                      }`}
                    >
                      {doc.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
