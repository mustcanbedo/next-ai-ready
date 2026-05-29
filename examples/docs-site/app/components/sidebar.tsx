"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocMeta } from "@/lib/docs";

interface SidebarProps {
  groups: Record<string, DocMeta[]>;
  sectionLabels: Record<string, string>;
}

export function Sidebar({ groups, sectionLabels }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border">
      <nav className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 pr-4">
        {Object.entries(groups).map(([section, docs]) => (
          <div key={section} className="mb-6">
            <h4 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              {sectionLabels[section] ?? section}
            </h4>
            <ul className="space-y-0.5">
              {docs.map((doc) => {
                const href = `/docs/${doc.slug}`;
                const isActive = pathname === href;
                return (
                  <li key={doc.slug}>
                    <Link
                      href={href}
                      className={`block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-bg-alt font-medium text-text"
                          : "text-text-secondary hover:text-text hover:bg-bg-alt/50"
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
