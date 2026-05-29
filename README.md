# next-ai-ready

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

### Analytics hooks

Know which AI bots read your content and which actions agents invoke:

```ts
// instrumentation.ts
import { registerAiHooks } from "@next-ai-ready/next"

registerAiHooks({
  onAiRequest: (info) => analytics.track("ai_request", info),  // bot, ua, path, artifact
  onInvoke:    (info) => analytics.track("ai_invoke", info),   // action, latency, ok, caller
})
```

## Status

🚧 **Pre-alpha**, but the core stack is implemented and tested (85 tests across 8 packages):

- ✅ **Knowledge plane** — MDX → semantic graph → `llms.txt` / `*.md` / `*.ai.json` / JSON-LD
- ✅ **Capability plane** — `defineAction` → `/api/actions/<name>` + OpenAPI 3.1 / `tools.json` / `ai-plugin.json`
- ✅ **MCP server** — actions as MCP tools + pages as resources (HTTP + stdio)
- ✅ **Dev tooling** — `build` / `init` / `doctor` / `mcp` CLIs, `robots.txt`, analytics hooks
- ⏳ **Docs site** — in progress

See [`docs/`](./docs):

- [`docs/goals.md`](./docs/goals.md) — North star: AEO + Agent capability
- [`docs/research.md`](./docs/research.md) — Competitive landscape
- [`docs/architecture.md`](./docs/architecture.md) — Full architecture
- [`docs/decisions.md`](./docs/decisions.md) — Architecture decision records
- [`docs/roadmap.md`](./docs/roadmap.md) — Phased delivery plan

## License

MIT
