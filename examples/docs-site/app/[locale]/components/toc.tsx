"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
  locale: Locale;
}

export function TableOfContents({ headings, locale }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block w-48 shrink-0">
      <div className="sticky top-[60px] pt-10">
        <h5 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary/60 mb-4">
          {locale === "en" ? "On this page" : "本页目录"}
        </h5>
        <ul className="space-y-1.5 border-l border-white/[0.04]">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={`block text-[12px] leading-5 transition-all border-l -ml-px ${
                  heading.level === 3 ? "pl-5" : "pl-3"
                } ${
                  activeId === heading.id
                    ? "text-text border-accent"
                    : "text-text-tertiary/60 border-transparent hover:text-text-secondary hover:border-white/[0.1]"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
