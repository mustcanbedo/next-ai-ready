"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Messages } from "@/messages";
import type { Locale } from "@/lib/i18n";

interface HeaderProps {
  locale: Locale;
  messages: Messages["nav"];
}

export function Header({ locale, messages }: HeaderProps) {
  const pathname = usePathname();

  const switchLocale = locale === "en" ? "zh" : "en";
  const switchPath = pathname.replace(`/${locale}`, `/${switchLocale}`);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 group"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white group-hover:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-shadow">
              ai
            </span>
            <span className="text-sm font-semibold text-text">
              next-ai-ready
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}/docs/introduction`}
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              {messages.docs}
            </Link>
            <Link
              href={`/${locale}/docs/guides/quickstart`}
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              {messages.quickstart}
            </Link>
            <Link
              href={`/${locale}/docs/api/config`}
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              {messages.api}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={switchPath}
            className="text-xs font-medium text-text-tertiary hover:text-text border border-border rounded-md px-2 py-1 transition-colors"
          >
            {locale === "en" ? "中文" : "EN"}
          </Link>
          <a
            href="https://github.com/mustcanbedo/next-ai-ready"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-tertiary hover:text-text transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
