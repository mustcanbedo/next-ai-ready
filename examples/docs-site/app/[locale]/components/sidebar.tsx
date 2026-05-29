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
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-10 pl-6 pr-4">
        {Object.entries(groups).map(([section, docs]) => (
          <div key={section} className="mb-8">
            <h4 className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary/80">
              {sectionLabels[section] ?? section}
            </h4>
            <ul className="space-y-px">
              {docs.map((doc) => {
                const href = `/${locale}/docs/${doc.slug}`;
                const isActive = pathname === href;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={href}
                      className={`relative block rounded-lg px-3 py-2 text-[13px] transition-all ${
                        isActive
                          ? "bg-white/[0.04] text-text font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-accent"
                          : "text-text-tertiary hover:text-text hover:bg-white/[0.02]"
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
