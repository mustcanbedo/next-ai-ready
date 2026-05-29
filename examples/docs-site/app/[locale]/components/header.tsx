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
    <header className="fixed top-0 z-50 w-full bg-bg/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]">
      <div className="mx-auto flex h-[60px] max-w-[1400px] items-center px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="group flex items-center mr-10"
        >
          <span className="text-[17px] tracking-[-0.02em] text-text/90 group-hover:text-white transition-colors">
            <span className="font-normal">next</span>
            <span className="text-text-tertiary/50 mx-[2px]">/</span>
            <span className="font-semibold">ai-ready</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href={`/${locale}/docs/introduction`} active={pathname.includes("/docs")}>
            {messages.docs}
          </NavLink>
          <NavLink href={`/${locale}/docs/guides/quickstart`} active={pathname.includes("/guides")}>
            {messages.quickstart}
          </NavLink>
          <NavLink href={`/${locale}/docs/api/config`} active={pathname.includes("/api")}>
            {messages.api}
          </NavLink>
          <a
            href="https://github.com/mustcanbedo/next-ai-ready"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center h-9 px-3 text-[13px] text-text-tertiary hover:text-text rounded-lg hover:bg-white/[0.03] transition-all"
          >
            GitHub
          </a>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search placeholder */}
        <div className="hidden lg:flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-tertiary/60 text-[13px] mr-4 cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.08] transition-all w-56">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span>{locale === "en" ? "Search docs..." : "搜索文档..."}</span>
          <kbd className="ml-auto text-[11px] font-mono text-text-tertiary/40 border border-white/[0.06] rounded px-1.5 py-0.5">⌘K</kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href={switchPath}
            className="flex items-center h-9 px-3 text-[13px] font-medium text-text-tertiary hover:text-text rounded-lg hover:bg-white/[0.04] transition-all"
          >
            {locale === "en" ? "中文" : "EN"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center h-9 px-3.5 text-[14px] rounded-lg transition-all ${
        active
          ? "text-text font-medium bg-white/[0.05]"
          : "text-text-tertiary hover:text-text hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </Link>
  );
}
