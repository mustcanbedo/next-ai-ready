"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Braces, CodeXml, FileText, Menu, Search, X } from "lucide-react";
import type { Messages } from "@/messages";
import type { Locale } from "@/lib/i18n";
import type { DocMeta } from "@/lib/docs";
import { searchDocs } from "@/lib/doc-search";
import { ThemeSelect } from "./theme-select";

interface HeaderProps {
  locale: Locale;
  messages: Messages["nav"];
  docs: DocMeta[];
}

export function Header({ locale, messages, docs }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const chinese = locale === "zh";
  const searchLabel = chinese ? "搜索文档" : "Search documentation";
  const closeLabel = chinese ? "关闭搜索" : "Close search";
  const switchPath = pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${chinese ? "en" : "zh"}`);
  const results = searchDocs(docs, query);
  const links = [
    { href: `/${locale}/docs/introduction`, label: messages.docs, active: pathname.includes("/docs") && !/\/docs\/(guides|api-reference|support)/.test(pathname) },
    { href: `/${locale}/docs/guides/quickstart`, label: messages.quickstart, active: pathname.includes("/docs/guides/") },
    { href: `/${locale}/docs/api-reference/config`, label: messages.api, active: pathname.includes("/docs/api-reference/") },
    { href: `/${locale}/docs/support`, label: messages.support, active: pathname.endsWith("/docs/support") },
  ];

  function openSearch() {
    setMenuOpen(false);
    dialog.current?.showModal();
    searchInput.current?.focus();
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key === "Escape" && dialog.current?.open) {
        event.preventDefault();
        dialog.current.close();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        dialog.current?.showModal();
        searchInput.current?.focus();
      }
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [menuOpen]);

  useEffect(() => {
    dialog.current?.close();
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = links.map((link) => (
    <Link key={link.href} href={link.href} prefetch={false} aria-current={link.active ? "page" : undefined} onClick={() => setMenuOpen(false)}>
      {link.label}
    </Link>
  ));

  return <>
    <a className="skip-link" href="#main-content">{chinese ? "跳到正文" : "Skip to content"}</a>
    <header className="site-header">
      <div className="header-inner">
        <Link href={`/${locale}`} className="brand" aria-label="next-ai-ready">
          <span className="brand-mark"><Braces size={17} aria-hidden="true" /></span>
          <span>next-ai-ready</span>
        </Link>
        <nav className="header-nav" aria-label={chinese ? "主导航" : "Main navigation"}>{navLinks}</nav>
        <div className="header-actions">
          <button type="button" className="search-trigger" onClick={openSearch} aria-label={searchLabel} title={searchLabel} aria-haspopup="dialog">
            <Search aria-hidden="true" /><span>{chinese ? "搜索文档…" : "Search docs…"}</span><kbd aria-hidden="true">⌘ K</kbd>
          </button>
          <a className="icon-button header-github" href="https://github.com/mustcanbedo/next-ai-ready" aria-label="GitHub" title="GitHub"><CodeXml aria-hidden="true" /></a>
          <ThemeSelect locale={locale} />
          <Link href={switchPath} className="locale-link" hrefLang={chinese ? "en" : "zh"} aria-label={chinese ? "Switch to English" : "切换到中文"}>{chinese ? "EN" : "中文"}</Link>
          <button ref={menuButton} type="button" className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={chinese ? "主菜单" : "Main menu"} aria-controls="mobile-main-nav" aria-expanded={menuOpen} title={chinese ? "主菜单" : "Main menu"}>
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav id="mobile-main-nav" className={`mobile-header-nav ${menuOpen ? "is-open" : ""}`} aria-label={chinese ? "移动主导航" : "Mobile navigation"}>
        {navLinks}
        <a href="https://github.com/mustcanbedo/next-ai-ready">GitHub</a>
      </nav>
    </header>
    <dialog ref={dialog} className="search-dialog" aria-label={searchLabel} onClose={() => setQuery("")} onClick={(event) => {
      if (event.target === dialog.current) {
        const rect = dialog.current.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current.close();
      }
    }}>
      <div className="search-input-row">
        <Search size={18} className="shrink-0 text-accent" aria-hidden="true" />
        <input ref={searchInput} type="search" aria-label={searchLabel} placeholder={chinese ? "查找指南、配置或 API" : "Find a guide, config or API"} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label={closeLabel} title={closeLabel}><X aria-hidden="true" /></button>
      </div>
      <p className="px-5 pt-4 text-xs text-text-tertiary" role="status">{query.trim() ? (chinese ? `${results.length} 条结果` : `${results.length} results`) : (chinese ? "开始阅读" : "Start reading")}</p>
      <div className="search-results">
        {results.length ? results.map((doc) => <Link href={`/${locale}/docs/${doc.slug}`} prefetch={false} key={doc.slug} className="search-result" onClick={() => dialog.current?.close()}>
          <FileText size={18} className="shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0 flex-1"><strong>{doc.title}</strong><p>{doc.summary}</p></div>
          <ArrowUpRight size={15} className="shrink-0 text-text-tertiary" aria-hidden="true" />
        </Link>) : <p className="p-5 text-sm text-text-secondary">{chinese ? "没有找到对应文档。" : "No matching documentation."}</p>}
      </div>
    </dialog>
  </>;
}
