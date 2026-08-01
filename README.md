# next-ai-ready

[中文文档](./README.zh-CN.md) | English

**Live docs:** [English](https://next-ai-ready.vercel.app/en) · [中文](https://next-ai-ready.vercel.app/zh)

[![npm alpha](https://img.shields.io/npm/v/next-ai-ready/alpha.svg?label=npm%20alpha)](https://www.npmjs.com/package/next-ai-ready)
[![CI](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/ci.yml)
[![Agent Readability](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml/badge.svg)](https://github.com/mustcanbedo/next-ai-ready/actions/workflows/agent-readability.yml)
[![Vercel Agent Readability: 100/100](https://img.shields.io/badge/Vercel%20Agent%20Readability-100%2F100-000000?logo=vercel)](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json)

> **Third-party tool baseline:** the production documentation scored **100/100** with Vercel's open-source `@vercel/agent-readability@0.5.0` on 2026-08-01. [Review the machine-readable result](./docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json) or reproduce it with `pnpm audit:vercel:site`. This measures technical agent readability, not search ranking, indexing, or citation.

> **Release channels:** this repository and the documentation site track `main`. npm currently serves `0.1.0-alpha.14`, including the TypeScript Action loader fix, focused runtime entrypoints, Audit v3, and MCP page discovery. The published dependency chain was verified with a clean registry install and a Next.js 15 production build on 2026-08-02.

> Traditional websites are built for browsers.
> **next-ai-ready** makes your Next.js site **readable** by AI and **callable** by agents.
>
> **Website = UI + Knowledge + Capability**

---

## What this is

`next-ai-ready` is the **AEO / Agent-API layer** for Next.js.

SEO optimizes your site for browsers and search engines.
`next-ai-ready` adds interfaces for **AI consumers** — so:

1. **AI systems can discover and retrieve clean representations of your content.**
2. **Authorized AI agents can call your features** as tools on behalf of users.

These interfaces improve technical accessibility; they do not guarantee indexing, ranking, citation, or inclusion in an AI-generated answer.

This is not a SaaS, not a dashboard, not a chatbot. It is a **developer infra tool** that lives next to `next.config.js`.

## What it produces

From the same Next.js app, with zero changes to your UI, you get:

| Artifact                        | Consumer                  |
| ------------------------------- | ------------------------- |
| HTML                            | Browsers (untouched)      |
| `/llms.txt`, `/llms-full.txt`   | LLMs, AI search crawlers  |
| `/sitemap.md`                   | Agent-readable page discovery |
| `/<route>.md`, `/<route>.ai.json` | Retrieval, RAG, AI ingestion |
| JSON-LD (`Article`, `FAQPage`, `WebPage`) | Search engines, AI search |
| `/openapi.json`, `/tools.json`, `/.well-known/ai-plugin.json` | Agents, OpenAPI consumers |
| `/api/mcp` (MCP server)         | MCP clients (Claude Desktop, Cursor, agents) |
| `/robots.txt` (explicit AI-bot policy) | AI crawlers |

## The two planes

```
                  ┌────────────────────────┐
                  │   Next.js App Router   │
                  └───────────┬────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       ┌────────────┐                  ┌──────────────┐
       │ Knowledge  │  ← MDX +         │  Capability  │  ← defineAction()
       │   plane    │   semantic{}     │     plane    │
       └─────┬──────┘                  └──────┬───────┘
             │                                │
        llms.txt                         openapi.json
        page.md / .ai.json               tools.json
        JSON-LD                          MCP server
```

## Quick taste

```ts
// app/docs/getting-started/page.mdx
export const semantic = {
  summary: "Install and run Acme in under 60 seconds.",
  topics: ["install", "quickstart"],
  questions: [{ q: "How do I install Acme?", a: "Run `pnpm i acme`." }],
}

# Getting Started
...
```

```ts
// actions/search-product.ts
import { defineAction } from "next-ai-ready"
import { z } from "zod"

export default defineAction({
  name: "search_product",
  description: "Search products by keyword.",
  whenToUse: "When the user wants to find products in our catalog.",
  input: z.object({ keyword: z.string(), limit: z.number().default(10) }),
  output: z.object({ items: z.array(z.object({ id: z.string(), title: z.string() })) }),
  public: true,
  async handler({ keyword, limit }, ctx) {
    return { items: await db.products.search(keyword, limit) }
  },
})
```

```bash
pnpm add next-ai-ready@alpha
npx next-ai-ready init     # scaffold config + route stubs + starter action
npx next-ai-ready build    # emit llms.txt, sitemap.md, graph, OpenAPI, tools, robots
npx next-ai-ready doctor   # validate config, action exposure, route wiring (CI-friendly)
npx next-ai-ready audit https://example.com/about  # verify the deployed page agents receive
npx next-ai-ready audit https://example.com/about --version 2 --json  # five-dimensional report
npx next-ai-ready audit https://example.com/about --version 3 --json  # three-plane strict preflight
npx next-ai-ready mcp      # run an MCP server over stdio (Claude Desktop / Cursor)
```

Then run `next build` to expose the generated discovery, retrieval, and capability interfaces.

Opt in to Markdown content negotiation in `next.config.mjs`:

```js
// next.config.mjs
import { withAiReady } from "next-ai-ready"

const nextConfig = {}

export default withAiReady({ agentReadable: true })(nextConfig)
```

This serves page Markdown for `Accept: text/markdown` and known agent User-Agents, while normal browser requests continue to receive HTML. Missing browser pages keep a real HTTP `404`; missing Markdown representations return a `200` recovery document with the requested path, discovery links, and up to five relevant pages so agents can continue navigating.

`next-ai-ready audit <url>` verifies those browser and agent behaviors independently. Audit v1 remains the default, preserving its JSON shape, score, and CI exit behavior. Audit v2 remains available for its original five weighted dimensions. Use `--version 3` for separate Agent Readability, Semantic/AEO Quality, and Agent Capability planes with strict pass-only tier scoring. V3 is a fast local subset preflight, while the repository's pinned `@vercel/agent-readability` command remains the official external Readability quality gate.

**Get started in 10 minutes:** [`docs/quickstart-10min.md`](./docs/quickstart-10min.md) · [中文](./docs/quickstart-10min.zh-CN.md)

Or scaffold with:

```bash
npm create next-ai-ready@alpha my-app
cd my-app
npm install
npx next-ai-ready init
npm run dev
```

The scaffold creates a runnable minimal Next.js App Router TypeScript project and starter `content/index.mdx`. It deliberately leaves AI-ready config, route handlers, actions, and `withAiReady()` wiring to the following `next-ai-ready init` step.

### Analytics hooks

Know which AI bots read your content and which actions agents invoke:

```ts
// instrumentation.ts — runs in Node.js and Edge; keep Node-only imports in a separate file
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

// instrumentation-node.ts
import "server-only";
import { registerAiHooks } from "next-ai-ready/hooks";

registerAiHooks({
  onAiRequest: (info) => analytics.track("ai_request", info),  // bot, ua, path, artifact
  onInvoke:    (info) => analytics.track("ai_invoke", info),   // action, latency, ok, caller
})
```

Use `next-ai-ready/hooks` — not the main package entry — so Turbopack does not pull Node-only build code into the Edge instrumentation bundle.

### Package imports

Install only `next-ai-ready` in consumer apps. The published `alpha.14` supports these imports:

| Import | Use for |
|---|---|
| `next-ai-ready` | `defineConfig()`, `defineAction()`, `withAiReady()`, and `aiRobots()` |
| `next-ai-ready/hooks` | Runtime observability hooks |
| `next-ai-ready/handlers/*` | Generated App Router handlers |
| `next-ai-ready/actions`, `/config`, `/json-ld`, `/robots` | Focused runtime APIs with smaller tracing surfaces |
| `next-ai-ready/audit` | Programmatic Audit without loading the CLI dispatcher |

## Status

🚧 **Pre-alpha** (`0.1.0-alpha.14` published on npm `@alpha`). The public package now includes the runtime entrypoints, Audit v3 hardening, TypeScript Action loading, and MCP discovery work described above; see the [current improvement ledger](./docs/improvement-plan.zh-CN.md) for the remaining production validation and GA work.

- ✅ **Knowledge plane** — MDX → semantic graph → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **Capability plane** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP server** — actions as tools, pages as resources, and graph-backed `list_pages` / `get_page` / `search_pages` discovery (HTTP + stdio)
- ✅ **Dev tooling** — `build` / `init` / `doctor` / versioned `audit` / `mcp` CLIs, `robots.txt`, analytics hooks
- ✅ **Docs site** — live at [next-ai-ready.vercel.app](https://next-ai-ready.vercel.app/en) ([source](./examples/docs-site))

See [`docs/`](./docs) ([**full index**](./docs/README.md)):

- [`docs/goals.md`](./docs/goals.md) — North star: AEO + Agent capability
- [`docs/ga-readiness.md`](./docs/ga-readiness.md) — 0.1 GA checklist
- [`docs/post-ga.md`](./docs/post-ga.md) — Planned work after GA
- [`docs/research.md`](./docs/research.md) — Competitive landscape
- [`docs/architecture.md`](./docs/architecture.md) — Full architecture
- [`docs/decisions.md`](./docs/decisions.md) — Architecture decision records
- [`docs/roadmap.md`](./docs/roadmap.md) — Phased delivery plan
- [`docs/quickstart-10min.md`](./docs/quickstart-10min.md) — 10-minute onboarding

### Known limitations

- **Zod v4 required** — actions use `z.toJSONSchema()` which only exists in Zod v4. Install `zod@^4`.
- **Node.js runtime only** — all handlers export `runtime = "nodejs"`. Edge Runtime is not supported.
- **No static export** — `output: 'export'` in Next.js config is not compatible (handlers need server runtime).
- **No Pages Router** — App Router only. The `withAiReady()` wrapper and route handlers target App Router conventions.
- **Next.js 15+ recommended** — handlers use async `params`; Next 14 sync params supported via `resolveParams()` helper.
- **i18n graph is route-level, not CMS-aware** — `SemanticGraph` includes `locale` and `routesByLocale` when routes use prefixes (e.g. `/en/docs/...`). You still curate `llms.txt` sections and MCP resources per locale manually. See [i18n guide](https://next-ai-ready.vercel.app/en/docs/guides/i18n-ai-urls) and [Phase 6 design](./docs/phase6-design.md).

### Package layout (C-01)

Consumer apps should install **`next-ai-ready`** (meta package) only. It re-exports APIs, handler subpaths, and the CLI. The `@next-ai-ready/next` scoped package duplicates the CLI bin for monorepo development — do not install both in the same app.

See [installation — package exports](./examples/docs-site/content/en/docs/installation.mdx#package-exports-n-14).

## License

MIT
