# Architecture

> Read [`goals.md`](./goals.md) first. This document is the *how*; goals.md is the *why*.

## 1. System overview

`next-ai-ready` adds two new planes on top of a normal Next.js App Router app:

```
┌────────────────────────────────────────────────────────────────┐
│                     Next.js App Router                         │
│                  (your existing pages & API)                   │
└──────────────────────────────┬─────────────────────────────────┘
                               │
            ┌──────────────────┴───────────────────┐
            ▼                                      ▼
   ┌────────────────────┐                ┌──────────────────────┐
   │  Knowledge plane   │                │   Capability plane   │
   │                    │                │                      │
   │  MDX + semantic{}  │                │   defineAction()     │
   │         │          │                │          │           │
   │         ▼          │                │          ▼           │
   │  SemanticGraph     │                │   ActionRegistry     │
   │   (.next-ai-ready/ │                │    (.next-ai-ready/  │
   │    graph.json)     │                │  actions.manifest)   │
   └─────────┬──────────┘                └───────────┬──────────┘
             │                                       │
       ┌─────┼──────────┬─────────┐         ┌────────┼─────────┬─────────┐
       ▼     ▼          ▼         ▼         ▼        ▼         ▼         ▼
   llms.txt page.md  ai.json  JSON-LD  openapi   tools    MCP server  ai-plugin
   llms-full          (RAG)    (SEO)   .json     .json    /api/mcp    .json
```

## 2. Two artifacts the runtime depends on

Everything below the bundler depends on **two JSON files** written by the build CLI:

- `.next-ai-ready/graph.json` — the SemanticGraph (all routes, sections, chunks, FAQ, entities, JSON-LD).
- `.next-ai-ready/actions.manifest.json` — list of registered actions + their JSON Schemas (without handlers).

Runtime handlers (`/llms.txt`, `/api/actions/:name`, `/api/mcp`, `/<route>.md`) read these files (cached on first read).

This means: **the bundler stays out of the picture**. Works under Webpack and Turbopack identically. Crucial for Next 15/16 compatibility.

## 3. Package layout (8 packages + meta)

```
next-ai-ready/                          (repo)
├─ packages/
│  ├─ core/         @next-ai-ready/core         types, config, scanner, IO
│  ├─ semantic/     @next-ai-ready/semantic     SemanticGraph, JSON-LD
│  ├─ mdx/          @next-ai-ready/mdx          MDX → semantic compiler
│  ├─ actions/      @next-ai-ready/actions      defineAction, registry, invoke
│  ├─ llms/         @next-ai-ready/llms         llms.txt, page.md generators
│  ├─ openapi/      @next-ai-ready/openapi      registry → OpenAPI / tools.json
│  ├─ mcp/          @next-ai-ready/mcp          registry → MCP (via mcp-handler)
│  ├─ next/         @next-ai-ready/next        Next plugin, CLI, handlers
│  └─ (meta)        next-ai-ready              re-exports common API
├─ examples/
│  ├─ docs-site/
│  └─ ecommerce/
└─ docs/
```

**Dependency direction** (strict):

```
next                → llms, openapi, mcp, semantic, actions, core
llms                → semantic, mdx, core
openapi, mcp        → actions, core
mdx                 → semantic, core
semantic, actions   → core
core                → (nothing app-specific)
```

## 4. Core types (`@next-ai-ready/core`)

The interface contract for the entire ecosystem.

```ts
export type SemanticNode = {
  id: string                        // stable hash of route + section
  route: string                     // "/docs/getting-started"
  kind: "page" | "section" | "faq" | "entity" | "chunk"
  title?: string
  summary?: string
  topics?: string[]
  questions?: { q: string; a: string }[]
  entities?: { name: string; type: string }[]
  body?: string                     // markdown
  citeUrl?: string                  // "https://acme.com/docs/x#install"
  updatedAt?: string                // ISO date
  author?: { name: string; url?: string }
  embeddingHint?: string
  children?: SemanticNode[]
  source: { file: string; line?: number }
}

export type SemanticGraph = {
  nodes: Record<string, SemanticNode>
  routes: Record<string, string>    // route → root node id
  site: SiteInfo
  generatedAt: string
}

export type SiteInfo = {
  name: string
  baseUrl: string
  description?: string
  organization?: { name: string; url?: string; logo?: string }
}

export type ActionDefinition<I = unknown, O = unknown> = {
  name: string                      // unique, snake_case validated
  description: string               // for humans
  whenToUse?: string                // for AI tool selection
  whenNotToUse?: string             // for AI tool selection
  input: ZodType<I>
  output?: ZodType<O>
  tags?: string[]
  examples?: { input: I; output?: O }[]
  public?: boolean                  // default false — must opt-in
  auth?: (req: Request) => boolean | Promise<boolean>
  handler: (input: I, ctx: ActionContext) => Promise<O> | O
}

export type ActionContext = {
  request: Request
  headers: Headers
  cookies: { get(name: string): { value: string } | undefined }
  // intentionally does NOT expose RSC-only APIs
}

export type AiReadyConfig = {
  site: SiteInfo
  content?: string[]                // globs, default ["app/**/*.{md,mdx}", "content/**/*.mdx"]
  actions?: ActionDefinition[] | string  // module path
  emit?: {
    llmsTxt?: boolean
    llmsFullTxt?: boolean
    pageMarkdown?: boolean
    pageAiJson?: boolean
    jsonLd?: boolean
    openapi?: boolean
    mcp?: { http?: boolean; stdio?: boolean }
  }
  llms?: {
    sections?: { title: string; include: string; priority?: "high" | "normal"; limit?: number }[]
    exclude?: string[]
  }
  semantic?: {
    chunk?: { maxTokens?: number; overlap?: number }
    extract?: { faq?: boolean; entities?: boolean; summary?: "auto" | SemanticProvider }
  }
  mdx?: {
    components?: Record<string, (props: any) => string>  // JSX → markdown text
  }
  hooks?: {
    onAiRequest?: (info: AiRequestInfo) => void          // crawler analytics
    onInvoke?: (info: InvokeInfo) => void                // action analytics
  }
}
```

These types are **frozen on 1.0** — any change after that is a major bump.

## 5. The two compilers

### 5.1 Semantic Compiler (`@next-ai-ready/mdx` + `@next-ai-ready/semantic`)

Pipeline (built on `unified`):

```
file → remark-parse → remark-mdx → remark-frontmatter
     → ai-extract-headings        // build section tree, preserve anchor IDs
     → ai-extract-faq             // detect Q/A patterns + frontmatter
     → ai-extract-entities        // explicit only in MVP
     → ai-extract-summary         // frontmatter → metadata → first paragraph
     → ai-extract-citeables       // pick out citable units (definitions, tables)
     → ai-mdx-to-markdown         // strip JSX (or map via mdx.components)
     → ai-chunk                   // token-aware, respects heading boundaries
     → emit-semantic-nodes
```

Outputs per route: one root `SemanticNode(kind="page")` with children, a `body` Markdown string, and JSON-LD blocks (`WebPage`, `Article`, `FAQPage`, `BreadcrumbList`).

**MVP rule:** purely deterministic. No LLM calls. A pluggable `SemanticProvider` interface exists but no implementations ship in MVP.

### 5.2 Action Compiler (`@next-ai-ready/actions`)

The `actions/index.ts` manifest is the user-authored source of truth:

```ts
import searchProduct from "./search-product"
import createOrder from "./create-order"
export const actions = [searchProduct, createOrder]
```

The build CLI imports it, calls `zod-to-json-schema` (or Zod 4 native), strips handlers, writes `.next-ai-ready/actions.manifest.json`:

```json
{
  "actions": [
    {
      "name": "search_product",
      "description": "...",
      "whenToUse": "...",
      "tags": ["catalog"],
      "public": true,
      "inputSchema": { /* JSON Schema */ },
      "outputSchema": { /* JSON Schema */ },
      "examples": [...]
    }
  ]
}
```

Three emitters consume this:

- `@next-ai-ready/openapi` → OpenAPI 3.1 + `/.well-known/ai-plugin.json` + `/tools.json`
- `@next-ai-ready/mcp` → MCP tool list via `vercel/mcp-handler`
- The runtime invoker → validates input with Zod, executes handler

## 6. The Next.js plugin (`@next-ai-ready/next`)

### 6.1 What `withAiReady()` does

Minimal — Turbopack-safe:

```ts
// next.config.mjs
import { withAiReady } from "@next-ai-ready/next"
export default withAiReady()({ /* your normal next config */ })
```

It:
1. Loads `ai-ready.config.ts`.
2. Appends `rewrites()` for `/:path*.md` and `/:path*.ai.json` → internal handler.
3. Sets `experimental.outputFileTracingIncludes` so `.next-ai-ready/*.json` ships with the serverless bundle.
4. Optionally augments `headers()` for AI bot CORS (configurable).

It **does not** register webpack/turbopack plugins, **does not** inject routes, **does not** use virtual modules. All these would break under Turbopack.

### 6.2 Route handlers — user opts in via codemod

Users run `npx next-ai-ready init`, which writes:

```
app/
├─ llms.txt/route.ts             →  export { GET } from "@next-ai-ready/next/handlers/llms-txt"
├─ llms-full.txt/route.ts        →  export { GET } from "@next-ai-ready/next/handlers/llms-full"
├─ openapi.json/route.ts         →  export { GET } from "@next-ai-ready/next/handlers/openapi"
├─ tools.json/route.ts           →  export { GET } from "@next-ai-ready/next/handlers/tools"
├─ .well-known/
│  └─ ai-plugin.json/route.ts    →  export { GET } from "@next-ai-ready/next/handlers/ai-plugin"
├─ api/
│  ├─ actions/[name]/route.ts    →  export { GET, POST } from "@next-ai-ready/next/handlers/actions"
│  ├─ mcp/[transport]/route.ts   →  export { GET, POST, DELETE } from "@next-ai-ready/next/handlers/mcp"
│  └─ _ai-ready/
│     ├─ md/[...path]/route.ts   →  rewrite target for /:path*.md
│     └─ ai-json/[...path]/route.ts
```

Each generated file is a **one-line re-export** — readable, auditable, customisable.

### 6.3 Build CLI

```bash
npx next-ai-ready build       # scan + compile + emit static artifacts
npx next-ai-ready dev         # watch mode (chokidar) for the same
npx next-ai-ready doctor      # AEO + Agent-readiness audit
npx next-ai-ready mcp         # stdio MCP server (for local desktop clients)
```

User's `package.json`:

```json
{ "scripts": { "build": "next-ai-ready build && next build" } }
```

This decoupling is the **key Next-version-independence move**: same flow under Webpack and Turbopack.

## 7. Runtime data flow

Request → handler → reads cached artifact → response:

| URL                              | Handler reads                          | Response          |
| -------------------------------- | -------------------------------------- | ----------------- |
| `/llms.txt`                      | (build wrote static; or graph.json)    | `text/plain`      |
| `/llms-full.txt`                 | graph.json                             | `text/plain`      |
| `/<route>.md`                    | graph.json → node.body                 | `text/markdown`   |
| `/<route>.ai.json`               | graph.json → node tree                 | `application/json`|
| `/openapi.json`                  | actions.manifest.json                  | `application/json`|
| `/tools.json`                    | actions.manifest.json                  | `application/json`|
| `/.well-known/ai-plugin.json`    | config + actions.manifest              | `application/json`|
| `POST /api/actions/:name`        | imports user handler, Zod validates    | result            |
| `/api/mcp`                       | `vercel/mcp-handler` + registry        | MCP stream        |

Cache strategy: each handler reads JSON once per process, holds in memory. Invalidation: on next deploy (production) / on file change via dev CLI (development).

## 8. Security model

- **`defineAction` is private by default.** `public: true` required to expose via HTTP/MCP. Compile-time check warns on actions exposed without explicit opt-in.
- **CORS:** same-origin by default. Per-action override possible.
- **Auth hook:** `defineAction({ auth: (req) => boolean })` runs before handler.
- **MCP endpoint:** requires `NEXT_AI_READY_MCP_TOKEN` env var in production. Open in dev only.
- **No rate limit baked in.** Provide `onInvoke` hook; users wire in their own (Upstash, etc.).
- **`server-only` import** in every handler module — guarantees no client leakage.

## 9. Observability

Two hooks, no dependencies:

```ts
hooks: {
  onAiRequest: ({ bot, path, artifact, ua }) => { /* user-defined */ },
  onInvoke:    ({ action, latencyMs, ok, error, caller }) => { /* user-defined */ },
}
```

AI bot detection is a small UA matcher in `core`: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `anthropic-ai`, `Google-Extended`, `CCBot`, `Bytespider`, `Applebot-Extended`, etc.

## 10. Runtime requirements

- **Node ≥ 20**
- **Next ≥ 14.2** (App Router only — Pages Router not supported)
- **Both Webpack and Turbopack** supported
- **Default serverless-compatible.** Each route handler runs on Node runtime (not Edge) because of `unified` ecosystem size.

## 11. What lives where (cheat sheet)

| Concern                       | Package                  |
| ----------------------------- | ------------------------ |
| Types, config loader, scanner | `core`                   |
| SemanticGraph, JSON-LD        | `semantic`               |
| MDX pipeline + extractors     | `mdx`                    |
| `defineAction`, registry, invoke | `actions`             |
| llms.txt / page.md / ai.json  | `llms`                   |
| OpenAPI / tools / ai-plugin   | `openapi`                |
| MCP bridge over mcp-handler   | `mcp`                    |
| Plugin, route handlers, CLI   | `next`                   |
