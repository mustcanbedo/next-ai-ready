import Link from "next/link";
import { Header } from "./components/header";
import { getMessages } from "@/messages";
import type { Locale } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = getMessages(locale as Locale);

  return (
    <div className="min-h-screen">
      <Header locale={locale as Locale} messages={t.nav} />

      {/* Hero — full viewport, centered, dramatic */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/50 px-4 py-1.5 text-xs text-text-secondary backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.hero.badge}
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-text sm:text-7xl lg:text-8xl whitespace-pre-line leading-[1.1]">
            {t.hero.title}
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-text-secondary leading-relaxed sm:text-xl">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/docs/introduction`}
              className="inline-flex h-12 items-center rounded-lg bg-accent px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:bg-accent-hover transition-all"
            >
              {t.hero.cta}
            </Link>
            <div className="inline-flex h-12 items-center rounded-lg border border-border bg-bg-elevated px-5 font-mono text-sm text-text-secondary select-all hover:border-text-tertiary transition-colors">
              {t.hero.install}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-tertiary">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-text-tertiary" />
        </div>
      </section>

      {/* Features grid — large section */}
      <section className="border-t border-border py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              {t.features.heading}
            </h2>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {t.features.subheading}
            </p>
          </div>

          <div className="grid gap-px bg-border rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((item) => (
              <div
                key={item.title}
                className="bg-bg p-8 hover:bg-bg-elevated/50 transition-colors"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg-elevated">
                  <FeatureIcon name={item.icon} />
                </div>
                <h3 className="text-base font-semibold text-text mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two planes — side by side with code examples */}
      <section className="border-t border-border py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Knowledge */}
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {t.planes.knowledge.label}
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 sm:text-3xl">
                {t.planes.knowledge.title}
              </h3>
              <p className="text-text-secondary leading-relaxed mb-8">
                {t.planes.knowledge.description}
              </p>
              <div className="rounded-xl border border-border bg-bg-card p-5 overflow-hidden">
                <pre className="text-[13px] font-mono text-text-secondary leading-6 overflow-x-auto">
                  <code>
{`# Acme Documentation

> The complete toolkit for building
> modern web applications.

## Docs

- [Getting Started](/docs/start)
  Install and configure in 60 seconds.
- [Authentication](/docs/auth)
  Secure your app with built-in auth.
- [Deployment](/docs/deploy)
  Deploy anywhere with one command.`}
                  </code>
                </pre>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="text-[11px] font-mono text-text-tertiary">/llms.txt</span>
                </div>
              </div>
            </div>

            {/* Capability */}
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {t.planes.capability.label}
              </div>
              <h3 className="text-2xl font-bold text-text mb-3 sm:text-3xl">
                {t.planes.capability.title}
              </h3>
              <p className="text-text-secondary leading-relaxed mb-8">
                {t.planes.capability.description}
              </p>
              <div className="rounded-xl border border-border bg-bg-card p-5 overflow-hidden">
                <pre className="text-[13px] font-mono text-zinc-300 leading-6 overflow-x-auto">
                  <code>
{`import { defineAction } from "next-ai-ready"
import { z } from "zod"

defineAction({
  name: "search_docs",
  description: "Search documentation.",
  input: z.object({
    query: z.string(),
    limit: z.number().default(5),
  }),
  public: true,
  handler: async ({ query, limit }) => {
    return await searchIndex(query, limit)
  },
})`}
                  </code>
                </pre>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent/80" />
                  <span className="text-[11px] font-mono text-text-tertiary">actions/search.mjs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artifacts strip */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-tertiary mb-8">
            {t.artifacts.heading}
          </h2>
          <div className="flex flex-wrap gap-3">
            {t.artifacts.items.map((item) => (
              <div
                key={item.path}
                className="inline-flex items-center gap-3 rounded-lg border border-border bg-bg-elevated/50 px-4 py-2.5 hover:border-text-tertiary transition-colors"
              >
                <span className="font-mono text-xs text-accent">{item.path}</span>
                <span className="text-xs text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t.cta.title}
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            {t.cta.subtitle}
          </p>
          <Link
            href={`/${locale}/docs/introduction`}
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:bg-accent-hover transition-all"
          >
            {t.cta.button}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-tertiary">{t.footer.license}</span>
            <span className="text-xs text-text-tertiary">{t.footer.builtWith}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/mustcanbedo/next-ai-ready"
              className="text-xs text-text-tertiary hover:text-text transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/next-ai-ready"
              className="text-xs text-text-tertiary hover:text-text transition-colors"
            >
              npm
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    search: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    zap: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    network: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    ),
    plug: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
    unlock: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    terminal: (
      <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}
