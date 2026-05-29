import Link from "next/link";
import { Header } from "./components/header";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            v0.1.0-alpha — now on npm
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            Make your Next.js site
            <br />
            <span className="text-text-tertiary">readable by AI,</span>
            <br />
            <span className="text-text-tertiary">callable by agents.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary max-w-lg">
            One config file. Zero changes to your UI. Your site becomes
            discoverable by AI search engines and callable by AI agents.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/docs/introduction"
              className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Read the docs
            </Link>
            <div className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-4 font-mono text-sm text-text-secondary select-all">
              pnpm add next-ai-ready
            </div>
          </div>
        </div>
      </section>

      {/* What it produces */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-10">
            From the same Next.js app, you get
          </h2>
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 rounded-lg overflow-hidden border border-border">
            {ARTIFACTS.map((item) => (
              <div key={item.title} className="bg-surface p-6">
                <div className="mb-3 font-mono text-xs text-text-tertiary">
                  {item.path}
                </div>
                <h3 className="text-sm font-semibold text-text mb-1">
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

      {/* Two planes */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Knowledge Plane
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">
                AI can read your content
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Your MDX pages are compiled into a semantic graph.
                AI search engines get structured, citable content via
                llms.txt, page-level Markdown, and JSON-LD.
              </p>
              <div className="rounded-lg border border-border bg-surface p-4">
                <pre className="text-xs font-mono text-text-secondary leading-5 overflow-x-auto">
{`# My Site

> Build faster with AI-ready tools.

## Pages

- [Getting Started](/docs/intro)
- [Defining Actions](/docs/actions)`}
                </pre>
                <div className="mt-2 text-[10px] font-mono text-text-tertiary">
                  /llms.txt
                </div>
              </div>
            </div>
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Capability Plane
              </div>
              <h3 className="text-xl font-semibold text-text mb-3">
                AI can call your features
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Define actions with schemas and handlers. They become
                OpenAPI endpoints, MCP tools, and a tools.json that
                any agent can consume.
              </p>
              <div className="rounded-lg border border-border bg-bg-code p-4">
                <pre className="text-xs font-mono text-zinc-300 leading-5 overflow-x-auto">
{`defineAction({
  name: "search_docs",
  description: "Search the documentation.",
  input: z.object({ q: z.string() }),
  output: z.object({ results: z.array(...) }),
  public: true,
  handler: async ({ q }) => search(q),
})`}
                </pre>
                <div className="mt-2 text-[10px] font-mono text-zinc-500">
                  actions/search-docs.mjs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            MIT License
          </p>
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

const ARTIFACTS = [
  {
    path: "/llms.txt",
    title: "LLM-readable index",
    description: "A structured summary of every page, optimized for AI search crawlers.",
  },
  {
    path: "/openapi.json",
    title: "OpenAPI 3.1 spec",
    description: "Your actions as a standard API spec. Any agent framework can consume it.",
  },
  {
    path: "/api/mcp",
    title: "MCP Server",
    description: "Model Context Protocol endpoint for Claude Desktop, Cursor, and agents.",
  },
  {
    path: "/<page>.md",
    title: "Per-page Markdown",
    description: "Clean Markdown rendition of each page for retrieval and RAG pipelines.",
  },
  {
    path: "/tools.json",
    title: "Tools manifest",
    description: "OpenAI-compatible tool definitions with descriptions and schemas.",
  },
  {
    path: "JSON-LD",
    title: "Structured data",
    description: "Article, FAQPage, WebPage markup that search engines and AI understand.",
  },
];
