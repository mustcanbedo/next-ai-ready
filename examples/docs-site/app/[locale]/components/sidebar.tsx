"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import type { DocMeta } from "@/lib/docs";
import type { Locale } from "@/lib/i18n";

interface SidebarProps {
  locale: Locale;
  groups: Record<string, DocMeta[]>;
  sectionLabels: Record<string, string>;
}

export function Sidebar({ locale, groups, sectionLabels }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const currentDoc = Object.values(groups).flat().find((doc) => pathname === `/${locale}/docs/${doc.slug}`);

  return (
    <aside className="docs-sidebar">
      <button ref={toggle} type="button" className="sidebar-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="docs-sidebar-nav" aria-label={locale === "zh" ? "文档目录" : "Documentation menu"}>
        <span><List aria-hidden="true" />{currentDoc?.title ?? (locale === "zh" ? "文档目录" : "Documentation")}</span>
        <ChevronDown aria-hidden="true" className={`shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <nav id="docs-sidebar-nav" className={`sidebar-nav ${open ? "is-open" : ""}`} aria-label={locale === "zh" ? "文档目录" : "Documentation"} onKeyDown={(event) => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } }}>
        {Object.entries(groups).map(([section, docs]) => (
          <div key={section} className="sidebar-section">
            <h4>
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
                      prefetch={false}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`sidebar-link ${isActive ? "font-medium" : ""}`}
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
