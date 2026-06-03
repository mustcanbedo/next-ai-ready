# next-ai-ready

[中文文档](./README.zh-CN.md) | English

**Live docs:** [English](https://next-ai-ready.vercel.app/en) · [中文](https://next-ai-ready.vercel.app/zh)

> Traditional websites are built for browsers.
> **next-ai-ready** makes your Next.js site **readable** by AI and **callable** by agents.
>
> **Website = UI + Knowledge + Capability**

---

## What this is

`next-ai-ready` is the **AEO / Agent-API layer** for Next.js.

SEO optimizes your site for browsers and search engines.
`next-ai-ready` optimizes your site for **AI consumers** — so:

1. **AI search engines cite you** (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews).
2. **AI agents call you** (your features become tools that agents can invoke on behalf of users).

This is not a SaaS, not a dashboard, not a chatbot. It is a **developer infra tool** that lives next to `next.config.js`.

## What it produces

From the same Next.js app, with zero changes to your UI, you get:

| Artifact                        | Consumer                  |
| ------------------------------- | ------------------------- |
| HTML                            | Browsers (untouched)      |
| `/llms.txt`, `/llms-full.txt`   | LLMs, AI search crawlers  |
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
import { defineAction } from "@next-ai-ready/actions"
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
pnpm add next-ai-ready
npx next-ai-ready init     # scaffold config + route stubs + starter action
npx next-ai-ready build    # emit llms.txt, graph, openapi.json, tools.json, robots.txt
npx next-ai-ready doctor   # validate config, action exposure, route wiring (CI-friendly)
npx next-ai-ready mcp      # run an MCP server over stdio (Claude Desktop / Cursor)
```

Then `next build` and you're discoverable + callable by AI.

**Get started in 10 minutes:** [`docs/quickstart-10min.md`](./docs/quickstart-10min.md) · [中文](./docs/quickstart-10min.zh-CN.md)

Or scaffold with:

```bash
npm create next-ai-ready@alpha my-app
```

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

Use `next-ai-ready/hooks` (or `@next-ai-ready/next/hooks`) — not the main package entry — so Turbopack does not pull Node-only build code into the Edge instrumentation bundle.

## Status

🚧 **Pre-alpha** (`0.1.0-alpha.10`, publish pending), core stack implemented and tested (145+ tests across 9 packages):

- ✅ **Knowledge plane** — MDX → semantic graph → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **Capability plane** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP server** — actions as MCP tools + pages as resources (HTTP + stdio)
- ✅ **Dev tooling** — `build` / `init` / `doctor` / `mcp` CLIs, `robots.txt`, analytics hooks
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

See [installation — package exports](./examples/docs-site/content/en/installation.mdx#package-exports-n-14).

## License

MIT
