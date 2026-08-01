# Research — Competitive Landscape & Prior Art

Snapshot taken at project kickoff, updated 2026-08-01 for alpha.11. Helps us **stand on shoulders, not reinvent**, and sharpen our positioning.

**next-ai-ready alpha.11** ships the full Knowledge + Capability planes, MCP (HTTP + stdio), local Doctor, deployed Audit, agent-readable content negotiation, analytics hooks, and an npm `@alpha` single-package install.

## Direct competitors (overlapping scope)

### 1. `harlan-zw/nuxt-ai-ready` — strongest framework reference

- **Repo:** https://github.com/harlan-zw/nuxt-ai-ready · **Ecosystem:** https://nuxtseo.com/
- **What it does:** Nuxt module for runtime Markdown negotiation and AI discovery, with database-backed indexing options, i18n, IndexNow, Content Signals, MCP page listing/search, and DevTools integration.
- **Strengths:** Mature Nuxt-native DX, runtime indexing, multiple storage providers, broad standards coverage, and distribution through the larger Nuxt SEO ecosystem.
- **What we should learn:** standards-first negotiation, useful Markdown recovery for missing pages, explicit page search tools, provider abstractions, and a clear open-source-to-Pro funnel.
- **What we should not copy yet:** mandatory runtime databases, a broad DevTools surface, or a hosted monitoring product before production adoption proves demand.
- **Our durable difference:** deterministic build output without a database, a first-class SemanticGraph and `.ai.json`, and a Capability plane that turns typed actions into HTTP, OpenAPI, and MCP tools.
- **Verdict:** Treat it as the interoperability benchmark, not as a blueprint to clone. Phase work must preserve our deterministic Next.js architecture.

### 2. `multivmlabs/aeo.js` — closest cross-framework competitor
- **Repo:** https://github.com/multivmlabs/aeo.js · **Site:** https://aeojs.org/
- **What it does:** Multi-framework AEO tool. Adapters for Next.js, Astro, Vite, Nuxt, Angular, Webpack. Generates `llms.txt`, `robots.txt`, `sitemap.xml`, JSON-LD. Includes a "Human/AI" visitor widget.
- **Strengths:** Broad framework support, marketing-friendly, clear AEO branding.
- **Gaps (our opportunity):**
  - **No Capability plane** — no `defineAction`, no OpenAPI, no MCP.
  - Treats AEO as a marketing problem (insert meta tags) rather than a content-pipeline problem (compile semantics from MDX).
  - Single-package design, not composable.
- **Verdict:** Strongest direct competitor on the Knowledge plane. We differentiate by being **Next-native, MDX-aware, and adding the entire Capability plane**.

### 3. `TurboDocx/next-plugin-llms`
- **Repo:** https://github.com/TurboDocx/next-plugin-llms
- **What it does:** Next.js plugin to generate `llms.txt` / `llms-full.txt` at build time. Per-page Markdown endpoints.
- **Strengths:** Clean, focused, mature implementation. Good reference for the llms.txt slice.
- **Gaps:** Single feature. No semantic graph, no actions, no MCP.
- **Verdict:** **Reference implementation** for `@next-ai-ready/llms`. We borrow patterns; we go much wider.

### 4. `fumadocs` (with `fumadocs-mdx`)
- **Repo:** https://github.com/fuma-nama/fumadocs · **Docs:** https://fumadocs.dev/
- **What it does:** Modern docs site framework. Recently added `llms.txt` generation + raw MDX serving via Loader API + processed Markdown content.
- **Strengths:** Best-in-class MDX → AI-ready content pipeline. Excellent DX.
- **Gaps:** It's a **docs site framework**, not a general layer. To get its AI features, you have to adopt fumadocs entirely. No Capability plane.
- **Verdict:** Aspirational benchmark for our MDX compiler. We aim for **comparable Knowledge quality on any Next.js app**, not just docs sites.

### 5. `chikodilee/aeo-site`, `ai-search-guru/getcito`
- Smaller AEO-focused tools, mostly auditing / scoring oriented.
- **Verdict:** Confirms a `doctor` CLI is a valuable feature; nobody has merged auditing + framework integration.

## Adjacent — we will USE these, not compete

### 6. `vercel/mcp-handler` ⭐ critical dependency
- **Repo:** https://github.com/vercel/mcp-handler
- **What it does:** Official Vercel adapter that turns a Next.js / Nuxt / Svelte route into an MCP server. Supports Streamable HTTP and SSE.
- **Verdict:** **Use as-is for MCP transport.** Our `@next-ai-ready/mcp` package becomes a thin layer that hands our `ActionRegistry` to `mcp-handler` and exposes our SemanticGraph as MCP resources. Massive scope reduction.

### 7. `next-openapi-gen` / `next-rest-framework` / `next-openapi-route-handler`
- Zod-driven OpenAPI generation for Next.js route handlers.
- **Verdict:** We don't depend on them (our generator is simpler because we only emit one operation per registered action). But they validate the API shape and prove the Zod → OpenAPI pipeline. Our `@next-ai-ready/openapi` can borrow the Zod → JSON Schema choice (likely `zod-to-json-schema` or Zod 4 native).

### 8. `AnswerDotAI/llms-txt` — the spec
- **Repo:** https://github.com/AnswerDotAI/llms-txt
- **Verdict:** This is the canonical `llms.txt` specification. We follow it strictly.

### 9. Vercel AI SDK
- **Verdict:** Solves "use AI **in** your site". We solve "let AI **use** your site". Orthogonal; both can coexist.

## Adjacent — Next.js itself

### 10. Next.js 16 built-in MCP at `/_next/mcp`
- **Docs:** https://nextjs.org/docs/app/guides/mcp
- **What it is:** Built-in MCP endpoint in Next 16 dev server. Combined with `vercel/next-devtools-mcp`, exposes HMR errors, build diagnostics, runtime logs to **coding agents** (Cursor, Claude Code, etc.).
- **Why it matters to us:**
  - **Scope is different.** This is **dev-time, dev-diagnostics MCP** for the agent writing your code. We do **production-time, business-capability MCP** for the agent using your site.
  - **It validates the bet.** MCP being a first-class Next.js feature means our model (Next site → MCP server) is canon, not fringe.
  - **Naming caution.** We must avoid colliding with `/_next/mcp`. Our endpoint defaults to `/api/mcp`.

### 11. Next.js community discussions on llms.txt
- vercel/next.js discussions [#80692](https://github.com/vercel/next.js/discussions/80692), [#81182](https://github.com/vercel/next.js/discussions/81182)
- Community is asking for a `llms.(js|ts)` file convention analogous to `sitemap.ts`. Not landed yet. **Our package can implement this convention** and become the de-facto answer until Next merges something.

## Adjacent — content / spec ecosystem

- **llms.txt spec** (AnswerDotAI) — Markdown-based, intentionally human + LLM readable. We comply.
- **JSON-LD / Schema.org** — Required for AI search citation signals. We emit.
- **OpenAPI 3.1** — JSON Schema 2020-12 compatible; what every API-aware agent expects.
- **MCP (Model Context Protocol)** — Anthropic-led standard, now backed by Vercel, OpenAI, and others. We expose via `vercel/mcp-handler`.

## Positioning matrix

|                              | Knowledge plane | Capability plane | Framework-native | Composable |
| ---------------------------- | --------------- | ---------------- | ---------------- | ---------- |
| `nuxt-ai-ready`              | ✅✅            | ⚠️ (page MCP)    | ✅ (Nuxt)        | ✅         |
| `aeo.js`                     | ✅ (basic)      | ❌               | ✅ (multi)       | ❌         |
| `next-plugin-llms`           | ✅ (llms.txt)   | ❌               | ✅ (Next)        | ❌         |
| `fumadocs`                   | ✅✅ (best)     | ❌               | ⚠️ (docs only)  | ⚠️         |
| `vercel/mcp-handler`         | ❌              | ⚠️ (transport)  | ✅               | ✅         |
| `next-openapi-gen` & co      | ❌              | ⚠️ (OpenAPI)    | ✅               | ✅         |
| **`next-ai-ready`**          | ✅              | ✅               | ✅ (Next)        | ✅ (8 pkgs) |

The empty cell in the bottom row — the intersection of Knowledge × Capability × Next-native × composable — is the wedge.

## Take-aways for our design

1. **Use `vercel/mcp-handler`.** Cuts the MCP package down to a thin bridge.
2. **Treat `fumadocs`'s MDX pipeline as the quality bar.** Borrow techniques (especially `getText('raw')` and processed Markdown).
3. **Follow `AnswerDotAI/llms-txt` spec strictly.** Don't invent a competing format.
4. **Default endpoint `/api/mcp`,** not `/_next/mcp` (collision with Next 16 dev MCP).
5. **The `doctor` CLI is a real moat** — every AEO competitor stops at "we generate the file", nobody scores you.
6. **The Capability plane is what nobody else has** in the AEO category. Lead with it in marketing.
7. **Compatibility is a feature.** Test against Vercel's agent-readability rubric and Nuxt-style responses instead of grading only our own header conventions.
8. **Adopt page search in stages.** Start with deterministic in-memory search over SemanticGraph; add optional runtime providers only after real corpus sizes justify them.
9. **Keep open source implementation complete.** Monetize setup, review, support, and eventually hosted history/monitoring rather than locking basic protocols behind a paid tier.
