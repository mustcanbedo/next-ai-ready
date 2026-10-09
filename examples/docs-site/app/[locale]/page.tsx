import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, CircleDot, Network, Plug, Search, Terminal, Unlock, Zap } from "lucide-react";
import { Header } from "./components/header";
import { CopyButton } from "./components/copy-button";
import { getMessages } from "@/messages";
import { getAllDocs } from "@/lib/docs";
import { locales, type Locale } from "@/lib/i18n";
import { homeMetadata } from "@/lib/seo";

interface PageProps { params: Promise<{ locale: string }>; }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return homeMetadata(locale as Locale);
}

const featureIcons = { search: Search, zap: Zap, network: Network, plug: Plug, unlock: Unlock, terminal: Terminal };

export default async function HomePage({ params }: PageProps) {
  const { locale: value } = await params;
  if (!locales.includes(value as Locale)) notFound();
  const locale = value as Locale;
  const t = getMessages(locale);
  const docs = await getAllDocs(locale);

  return <>
    <Header locale={locale} messages={t.nav} docs={docs} />
    <main id="main-content" tabIndex={-1}>
      <section className="home-hero">
        <div className="home-container">
          <p className="release-note"><CircleDot aria-hidden="true" />{t.hero.badge}</p>
          <h1>{t.hero.title}</h1>
          <p className="hero-description">{t.hero.subtitle}</p>
          <div className="hero-actions">
            <Link href={`/${locale}/docs/installation`} className="primary-link">{t.hero.cta}<ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href={`/${locale}/docs/introduction`} className="text-link">{t.nav.docs}<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
      <section className="setup-section" aria-label={locale === "zh" ? "安装与验证" : "Install and verify"}>
        <div className="home-container">
          <div className="setup-terminal">
            <div className="terminal-bar">
              <span className="terminal-caption"><Terminal size={14} aria-hidden="true" />{locale === "zh" ? "安装与验证" : "Install & verify"}</span>
              <CopyButton text={t.hero.setup} locale={locale} />
            </div>
            <div className="terminal-body">
              <pre className="terminal-prompt" aria-hidden="true">{t.hero.setup.split("\n").map(() => "$\n").join("").trim()}</pre>
              <pre className="terminal-code"><code>{t.hero.setup}</code></pre>
            </div>
          </div>
          <p className="hero-success"><CheckCircle2 aria-hidden="true" />{t.hero.success}</p>
        </div>
      </section>
      <section className="audit-band">
        <div className="home-container audit-inner">
          <div><p className="eyebrow">{t.verification.label}</p><p className="audit-score">{t.verification.score}</p></div>
          <div className="audit-detail"><h2>{t.verification.title}</h2><p>{t.verification.description}</p><p>{t.verification.disclaimer}</p></div>
          <div className="audit-links flex flex-col gap-3">
            <a href="https://github.com/mustcanbedo/next-ai-ready/blob/main/docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json" className="text-link">{t.verification.evidence}<ArrowUpRight size={14} aria-hidden="true" /></a>
            <a href="https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml" className="text-xs text-text-secondary hover:underline">{t.verification.workflow}</a>
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="home-container proof-grid">
          <div>
            <p className="eyebrow">{t.proof.label}</p>
            <div className="section-heading"><div><h2>{t.proof.title}</h2><p>{t.proof.description}</p></div></div>
            <div className="flex flex-wrap gap-x-6 gap-y-4">
              <a href="https://github.com/mustcanbedo/next-ai-ready/tree/main/examples/docs-site" className="text-link">{t.proof.source}<ArrowUpRight size={15} aria-hidden="true" /></a>
              <a href="https://github.com/mustcanbedo/next-ai-ready/issues/new?template=early-adopter.yml" className="text-link">{t.proof.help}<ArrowRight size={15} aria-hidden="true" /></a>
            </div>
            <p className="mt-4 text-xs text-text-tertiary">{t.proof.capacity}</p>
          </div>
          <div>
            {t.proof.items.map((item) => <a key={item.href} href={item.href} className="artifact-row">
              <code>{item.href}</code><span className="ml-auto">{item.label}</span><ArrowUpRight size={15} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            </a>)}
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="home-container">
          <div className="section-heading"><div><h2>{t.features.heading}</h2><p>{t.features.subheading}</p></div></div>
          <div className="feature-grid">
            {t.features.items.map((item) => {
              const Icon = featureIcons[item.icon as keyof typeof featureIcons];
              return <div key={item.title} className="feature-item"><Icon aria-hidden="true" /><h3>{item.title}</h3><p>{item.description}</p></div>;
            })}
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="home-container">
          <div className="plane-grid">
            <div><div className="eyebrow text-accent">{t.planes.knowledge.label}</div><h3>{t.planes.knowledge.title}</h3><p>{t.planes.knowledge.description}</p><a href="/llms.txt" className="text-link">/llms.txt<ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <div><div className="eyebrow text-warm">{t.planes.capability.label}</div><h3>{t.planes.capability.title}</h3><p>{t.planes.capability.description}</p><Link href={`/${locale}/docs/guides/mcp-integration`} className="text-link">{t.nav.api}<ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
          <h2 className="eyebrow mt-10">{t.artifacts.heading}</h2>
          <div className="artifact-index">{t.artifacts.items.map((item) => <div key={item.path}><code>{item.path}</code><span>{item.label}</span></div>)}</div>
        </div>
      </section>
      <section className="home-section">
        <div className="home-container">
          <div className="section-heading"><div><h2>{t.guides.heading}</h2><p>{t.guides.subheading}</p></div><Link href={`/${locale}/docs/guides/quickstart`} className="text-link">{t.nav.quickstart}<ArrowRight size={15} aria-hidden="true" /></Link></div>
          <div className="guide-grid">{t.guides.items.map((guide, index) => <Link key={guide.href} href={guide.href} className="guide-link">
            <span className="guide-number" aria-hidden="true">0{index + 1}</span><div><h3>{guide.title}</h3><p>{guide.description}</p></div><ArrowUpRight aria-hidden="true" />
          </Link>)}</div>
        </div>
      </section>
      <section className="closing-section"><div className="home-container closing-inner"><div><h2>{t.cta.title}</h2><p>{t.cta.subtitle}</p></div><Link href={`/${locale}/docs/installation`} className="primary-link">{t.cta.button}<ArrowRight size={16} aria-hidden="true" /></Link></div></section>
    </main>
    <footer className="site-footer"><div className="home-container footer-inner"><div className="flex flex-wrap gap-5"><span>{t.footer.license}</span><span>{t.footer.builtWith}</span></div><div className="flex gap-6"><a href="https://github.com/mustcanbedo/next-ai-ready">GitHub</a><a href="https://www.npmjs.com/package/next-ai-ready">npm</a></div></div></footer>
  </>;
}
