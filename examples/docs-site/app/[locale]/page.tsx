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

      {/* Hero — full viewport with grid + beams */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid" />
        {/* Radial fade mask */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg)_70%)]" />

        {/* Aurora gradient — animated color shift */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-30 blur-[120px] pointer-events-none animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-purple-500/30 to-cyan-400/40 rounded-full" />
        </div>

        {/* Animated beams — more visible */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[200px] left-[20%] w-[2px] h-[500px] bg-gradient-to-b from-transparent via-accent/50 to-transparent animate-beam [animation-delay:0s]" />
          <div className="absolute -top-[200px] left-[50%] w-[2px] h-[400px] bg-gradient-to-b from-transparent via-purple-400/40 to-transparent animate-beam [animation-delay:2.5s]" />
          <div className="absolute -top-[200px] left-[75%] w-[2px] h-[450px] bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent animate-beam [animation-delay:5s]" />
        </div>

        {/* Meteors — bigger, brighter */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[8%] right-[5%] h-[2px] w-[120px] bg-gradient-to-r from-white/60 via-accent/50 to-transparent rotate-[215deg] animate-meteor [animation-delay:0.5s]" />
          <div className="absolute top-[25%] right-[20%] h-[2px] w-[90px] bg-gradient-to-r from-white/50 via-purple-400/40 to-transparent rotate-[215deg] animate-meteor [animation-delay:3s]" />
          <div className="absolute top-[12%] right-[40%] h-[2px] w-[150px] bg-gradient-to-r from-white/40 via-cyan-300/30 to-transparent rotate-[215deg] animate-meteor [animation-delay:5.5s]" />
          <div className="absolute top-[35%] right-[55%] h-[2px] w-[100px] bg-gradient-to-r from-white/30 via-accent/30 to-transparent rotate-[215deg] animate-meteor [animation-delay:7s]" />
        </div>

        {/* Secondary glow orbs */}
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-purple-500/[0.04] rounded-full blur-[80px] pointer-events-none animate-float [animation-delay:2s]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] bg-cyan-400/[0.03] rounded-full blur-[80px] pointer-events-none animate-float [animation-delay:4s]" />

        {/* Hero content with staggered fade-up */}
        <div className="relative max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-xs text-text-secondary backdrop-blur-sm animate-fade-up [animation-delay:0.1s]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.hero.badge}
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.03em] text-text sm:text-7xl lg:text-[5.5rem] whitespace-pre-line leading-[1.05] animate-fade-up [animation-delay:0.2s]">
            {t.hero.title}
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-text-secondary/80 leading-relaxed sm:text-xl animate-fade-up [animation-delay:0.4s]">
            {t.hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up [animation-delay:0.6s]">
            <Link
              href={`/${locale}/docs/introduction`}
              className="group relative inline-flex h-12 items-center rounded-xl bg-accent px-7 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-accent-hover transition-all"
            >
              <span className="relative z-10">{t.hero.cta}</span>
            </Link>
            <div className="inline-flex h-12 items-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 font-mono text-sm text-text-secondary select-all hover:border-white/[0.15] hover:bg-white/[0.04] transition-all backdrop-blur-sm">
              {t.hero.install}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in [animation-delay:1.2s]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/10 to-white/20" />
            <svg className="h-3 w-3 text-text-tertiary/50 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative border-t border-white/[0.04] py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              {t.features.heading}
            </h2>
            <p className="mt-4 text-lg text-text-secondary leading-relaxed">
              {t.features.subheading}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((item, i) => (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                {/* Card shimmer on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-border" />
                <div className="relative">
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:border-accent/30 group-hover:bg-accent/[0.06] transition-all">
                    <FeatureIcon name={item.icon} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-text mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-text-secondary/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two planes — side by side with code examples */}
      <section className="relative border-t border-white/[0.04] py-32 overflow-hidden">
        {/* Subtle grid behind */}
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Knowledge */}
            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
                {t.planes.knowledge.label}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-text mb-3 sm:text-3xl">
                {t.planes.knowledge.title}
              </h3>
              <p className="text-text-secondary/80 leading-relaxed mb-8">
                {t.planes.knowledge.description}
              </p>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] p-5 overflow-hidden ring-1 ring-white/[0.04] shadow-2xl shadow-black/30">
                <pre className="text-[13px] font-mono text-text-secondary/90 leading-7 overflow-x-auto">
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
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80 animate-pulse" />
                  <span className="text-[11px] font-mono text-text-tertiary">/llms.txt</span>
                </div>
              </div>
            </div>

            {/* Capability */}
            <div>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/80">
                {t.planes.capability.label}
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-text mb-3 sm:text-3xl">
                {t.planes.capability.title}
              </h3>
              <p className="text-text-secondary/80 leading-relaxed mb-8">
                {t.planes.capability.description}
              </p>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] p-5 overflow-hidden ring-1 ring-white/[0.04] shadow-2xl shadow-black/30">
                <pre className="text-[13px] font-mono text-zinc-300/90 leading-7 overflow-x-auto">
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
                <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-accent/80 animate-pulse" />
                  <span className="text-[11px] font-mono text-text-tertiary">actions/search.mjs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artifacts strip */}
      <section className="border-t border-white/[0.04] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary/60 mb-8">
            {t.artifacts.heading}
          </h2>
          <div className="flex flex-wrap gap-3">
            {t.artifacts.items.map((item) => (
              <div
                key={item.path}
                className="group inline-flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:border-accent/30 hover:bg-accent/[0.03] transition-all duration-300"
              >
                <span className="font-mono text-xs text-accent group-hover:text-accent">{item.path}</span>
                <span className="text-xs text-text-secondary/60 group-hover:text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.04] py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-5xl">
            {t.cta.title}
          </h2>
          <p className="mt-5 text-lg text-text-secondary/70">
            {t.cta.subtitle}
          </p>
          <Link
            href={`/${locale}/docs/introduction`}
            className="mt-10 inline-flex h-12 items-center rounded-xl bg-accent px-7 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:bg-accent-hover transition-all"
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
