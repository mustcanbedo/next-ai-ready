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

// Keep search-facing page titles intact while using scannable navigation labels.
const guideLabels: Record<string, Record<Locale, string>> = {
  "guides/nextjs-llms-txt": { en: "llms.txt & Markdown", zh: "llms.txt 与 Markdown" },
  "guides/mcp-integration": { en: "MCP server", zh: "MCP 服务接入" },
  "guides/mdx-content": { en: "MDX content collections", zh: "MDX 内容集合" },
  "guides/robots-txt": { en: "AI crawler policies", zh: "AI 爬虫策略" },
  "guides/fumadocs-ai-ready": { en: "Fumadocs integration", zh: "Fumadocs 接入" },
  "guides/nextra-ai-ready": { en: "Nextra integration", zh: "Nextra 接入" },
};

export function Sidebar({ locale, groups, sectionLabels }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const currentDoc = Object.values(groups).flat().find((doc) => pathname === `/${locale}/docs/${doc.slug}`);

  return (
    <aside className="docs-sidebar" onKeyDown={(event) => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } }}>
      <button ref={toggle} type="button" className="sidebar-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="docs-sidebar-nav" aria-label={locale === "zh" ? "文档目录" : "Documentation menu"}>
        <span><List aria-hidden="true" />{currentDoc ? guideLabels[currentDoc.slug]?.[locale] ?? currentDoc.title : (locale === "zh" ? "文档目录" : "Documentation")}</span>
        <ChevronDown aria-hidden="true" className={`shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <nav id="docs-sidebar-nav" className={`sidebar-nav ${open ? "is-open" : ""}`} aria-label={locale === "zh" ? "文档目录" : "Documentation"}>
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
                      title={doc.title}
                      onClick={() => setOpen(false)}
                      className={`sidebar-link ${isActive ? "font-medium" : ""}`}
                    >
                      {guideLabels[doc.slug]?.[locale] ?? doc.title}
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
