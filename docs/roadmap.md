# Roadmap

Phased delivery. Each phase produces a usable, shippable slice.

## Phase 0 — Repo bootstrap (0.5 day)

**Goal:** Empty monorepo skeleton that `pnpm install && pnpm build` works on.

- [x] `docs/` — research, goals, architecture, decisions, roadmap (this doc)
- [ ] `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`
- [ ] 8 packages + meta package skeletons (just `package.json` + empty `src/index.ts`)
- [ ] `.changeset/`, `.gitignore`, MIT `LICENSE`
- [ ] CI: GitHub Actions for `pnpm install && pnpm typecheck && pnpm test`
- [ ] `core/src/types.ts` — the **type contract** for the whole system

**Exit criteria:**
- `pnpm install` clean.
- `pnpm -r build` produces dist for every package (even if empty).
- `core` exports the types in [`architecture.md §4`](./architecture.md).

---

## Phase 1 — Knowledge plane core (2–3 days)

**Goal:** Compile an MDX corpus into a `SemanticGraph`, emit JSON-LD.

### Deliverables
- `@next-ai-ready/core`
  - `defineConfig()`, config loader, scanner (`fast-glob`).
  - `serializeStable()` JSON helper.
  - AI-bot UA matcher.
- `@next-ai-ready/mdx`
  - Unified pipeline + extractors: headings, FAQ, summary, citables, MDX → MD, chunking.
  - Default JSX → text component map.
- `@next-ai-ready/semantic`
  - `buildGraph()`, `toJsonLd()` (`WebPage`, `Article`, `FAQPage`, `BreadcrumbList`).
- Tests: fixture MDX corpus (5–10 pages), snapshot test the graph + JSON-LD.

### Exit criteria
- Given a fixture content folder, `buildGraph()` returns a deterministic SemanticGraph.
- JSON-LD validates against Schema.org via `schema-dts`.

---

## Phase 2 — llms.txt + per-page artifacts + Next integration (2 days)

**Goal:** First user-visible value. Drop the framework into a Next app and get `/llms.txt`, `/<route>.md`, `/<route>.ai.json`.

### Deliverables
- `@next-ai-ready/llms`
  - `llms.txt` generator (with `sections` + `priority` + `limit` curation).
  - `llms-full.txt` generator.
  - Per-route Markdown renderer.
- `@next-ai-ready/next`
  - `withAiReady()` (config loader, rewrites, file tracing).
  - Route handlers: `llms-txt`, `llms-full`, `page-md`, `page-ai-json`.
  - `next-ai-ready build` CLI (scan → compile → write `.next-ai-ready/*.json` + `public/llms*.txt`).
  - `next-ai-ready init` codemod (writes handler files into `app/`).
- `examples/docs-site` consuming all of the above.

### Exit criteria
- Fresh Next app + `pnpm add next-ai-ready` + `init` + `build` produces working `/llms.txt`, `/docs/foo.md`, `/docs/foo.ai.json`.
- **🚀 First public alpha tag.**

---

## Phase 3 — Capability plane (2–3 days)

**Goal:** `defineAction` → callable HTTP endpoint + OpenAPI + tools.json.

### Deliverables
- `@next-ai-ready/actions`
  - `defineAction()`, `ActionRegistry`, `invoke()`.
  - Zod ↔ JSON Schema adapter (Zod 3 and 4).
  - Manifest emission (handlers stripped).
- `@next-ai-ready/openapi`
  - Registry → OpenAPI 3.1.
  - `/tools.json` (generic AI tool manifest).
  - `/.well-known/ai-plugin.json`.
- `@next-ai-ready/next`
  - Handlers: `actions`, `openapi`, `tools`, `ai-plugin`.
  - `init` codemod updated.
- `examples/ecommerce` with `search_product`, `get_order_status` actions.

### Exit criteria
- `POST /api/actions/search_product` with valid Zod input returns result.
- `GET /openapi.json` validates against OpenAPI 3.1 spec.
- `GET /tools.json` consumable by a hand-rolled fetch agent.
- Public/private gate enforced.

---

## Phase 4 — MCP server (1–2 days)

**Goal:** Expose ActionRegistry + SemanticGraph as a Model Context Protocol server.

### Deliverables
- `@next-ai-ready/mcp`
  - Bridge: `ActionRegistry` → MCP tools (via `vercel/mcp-handler`).
  - Bridge: `SemanticGraph` → MCP resources (`ai-ready://route` URIs returning page.md).
  - HTTP/Streamable transport mounted at `/api/mcp`.
  - stdio CLI: `npx next-ai-ready mcp` for desktop clients (Claude Desktop config snippet in docs).
- Auth: token gate on production endpoint.

### Exit criteria
- Claude Desktop can connect (stdio) and list/call tools.
- A hosted Next app's `/api/mcp` works through `mcp-remote`.

---

## Phase 5 — DX polish + Doctor CLI + dogfood docs site (2 days)

**Goal:** Production readiness for early adopters.

### Deliverables
- `next-ai-ready doctor` — audits a site against the 24 tactics in [`goals.md`](./goals.md). Outputs JSON + colored CLI report.
  - Checks: `llms.txt` present, JSON-LD valid, `robots.txt` allows GPTBot, action schemas have `whenToUse`, etc.
- `aiRobots()` helper for `app/robots.ts`.
- Dev watcher CLI (`next-ai-ready dev`).
- Error messages with action items.
- Docs site (built with `next-ai-ready` itself — dogfood).
- `npm create next-ai-ready` scaffold (optional, defer if tight).

### Exit criteria
- A new user can go from `npx create-next-app` to `next-ai-ready doctor` score >80 in <10 minutes.
- **🚀 0.1 release.**

---

## Phase 6 — Post-MVP (not scheduled)

Candidates, ordered roughly:

- LLM-backed `SemanticProvider` adapter (OpenAI, Anthropic, local).
- Content source adapters: `fumadocs-mdx`, `velite`, Notion, Sanity.
- Embedding-ready output (`chunks[].embedding` opt-in).
- Edge runtime port (after `unified` slimming).
- Rate-limit / auth recipes (Upstash, Clerk).
- Multi-language / i18n in SemanticGraph.
- Visual UI for tool manifest preview.

## Explicitly out of scope (do not propose)

- Hosted SaaS, dashboard, analytics service
- Vector database / built-in retrieval
- Chatbot UI
- Browser automation / scraping
- CMS
- Pages Router

## Time accounting (rough)

| Phase | Days |
| ----- | ---- |
| 0     | 0.5  |
| 1     | 2.5  |
| 2     | 2    |
| 3     | 2.5  |
| 4     | 1.5  |
| 5     | 2    |
| **MVP total** | **~11 working days** |
