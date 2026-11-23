"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Braces, CodeXml, FileText, Menu, Search, X } from "lucide-react";
import type { Messages } from "@/messages";
import type { Locale } from "@/lib/i18n";
import type { DocMeta } from "@/lib/docs";
import { searchDocs, type DocSearchIndex } from "@/lib/doc-search";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadedIndex, setLoadedIndex] = useState<{ locale: Locale; index: DocSearchIndex }>();
  const [indexError, setIndexError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const chinese = locale === "zh";
  const searchLabel = chinese ? "搜索文档" : "Search documentation";
  const closeLabel = chinese ? "关闭搜索" : "Close search";
  const switchPath = pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${chinese ? "en" : "zh"}`);
  const index = loadedIndex?.locale === locale ? loadedIndex.index : undefined;
  const results = searchDocs(docs, query, index);
  const docsPath = `/${locale}/docs`;
  const quickstartPath = `${docsPath}/guides/quickstart`;
  const apiActive = pathname.startsWith(`${docsPath}/api-reference/`);
  const supportActive = pathname === `${docsPath}/support`;
  const links = [
    { href: `${docsPath}/introduction`, label: messages.docs, active: pathname.startsWith(`${docsPath}/`) && pathname !== quickstartPath && !apiActive && !supportActive },
    { href: quickstartPath, label: messages.quickstart, active: pathname === quickstartPath },
    { href: `${docsPath}/api-reference/config`, label: messages.api, active: apiActive },
    { href: `${docsPath}/support`, label: messages.support, active: supportActive },
  ];

  const openSearch = useCallback(() => {
    setMenuOpen(false);
    dialog.current?.showModal();
    searchInput.current?.focus();
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    if (!searchOpen || index) return;
    const controller = new AbortController();

    async function loadIndex() {
      try {
        const response = await fetch(`/${locale}/search-index.json`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        const data: DocSearchIndex = await response.json();
        if (!controller.signal.aborted) setLoadedIndex({ locale, index: data });
      } catch {
        if (!controller.signal.aborted) setIndexError(true);
      }
    }

    void loadIndex();
    return () => controller.abort();
  }, [index, locale, searchOpen]);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key === "Escape" && dialog.current?.open) {
        event.preventDefault();
        dialog.current.close();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [menuOpen, openSearch]);

  useEffect(() => {
    dialog.current?.close();
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = links.map((link) => (
    <Link key={link.href} href={link.href} prefetch={false} aria-current={link.active ? (pathname === link.href ? "page" : "location") : undefined} onClick={() => setMenuOpen(false)}>
      {link.label}
    </Link>
  ));

  const hasQuery = Boolean(query.trim());
  let searchStatus = hasQuery
    ? (chinese ? `${results.length} 条结果` : `${results.length} results`)
    : (chinese ? "开始阅读" : "Start reading");
  if (hasQuery && !index) {
    searchStatus = indexError
      ? (chinese ? "正文索引加载失败，当前仅搜索页面信息。" : "The full search index could not load. Showing page matches.")
      : (chinese ? "正在加载正文索引…" : "Loading the full search index…");
  }

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
    <dialog ref={dialog} className="search-dialog" aria-label={searchLabel} onClose={() => {
      setSearchOpen(false);
      setQuery("");
      setIndexError(false);
    }} onClick={(event) => {
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
      <p className="px-5 pt-4 text-xs text-text-tertiary" role="status">{searchStatus}</p>
      <div className="search-results">
        {results.map((doc) => <Link href={`${docsPath}/${doc.slug}${doc.heading ? `#${doc.heading.id}` : ""}`} prefetch={false} key={doc.slug} className="search-result" onClick={() => dialog.current?.close()}>
          <FileText size={18} className="shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0 flex-1"><strong>{doc.heading?.text ?? doc.title}</strong><p>{doc.heading ? doc.title : doc.summary}</p></div>
          <ArrowUpRight size={15} className="shrink-0 text-text-tertiary" aria-hidden="true" />
        </Link>)}
        {results.length === 0 && (index || indexError) && <p className="p-5 text-sm text-text-secondary">{chinese ? "没有找到对应文档。" : "No matching documentation."}</p>}
      </div>
    </dialog>
  </>;
}
