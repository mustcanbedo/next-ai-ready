# Research — Competitive Landscape & Prior Art

Snapshot taken at project kickoff. Helps us **stand on shoulders, not reinvent**, and sharpen our positioning.

## Direct competitors (overlapping scope)

### 1. `multivmlabs/aeo.js` — closest competitor
- **Repo:** https://github.com/multivmlabs/aeo.js · **Site:** https://aeojs.org/
- **What it does:** Multi-framework AEO tool. Adapters for Next.js, Astro, Vite, Nuxt, Angular, Webpack. Generates `llms.txt`, `robots.txt`, `sitemap.xml`, JSON-LD. Includes a "Human/AI" visitor widget.
- **Strengths:** Broad framework support, marketing-friendly, clear AEO branding.
- **Gaps (our opportunity):**
  - **No Capability plane** — no `defineAction`, no OpenAPI, no MCP.
  - Treats AEO as a marketing problem (insert meta tags) rather than a content-pipeline problem (compile semantics from MDX).
  - Single-package design, not composable.
- **Verdict:** Strongest direct competitor on the Knowledge plane. We differentiate by being **Next-native, MDX-aware, and adding the entire Capability plane**.

### 2. `TurboDocx/next-plugin-llms`
- **Repo:** https://github.com/TurboDocx/next-plugin-llms
- **What it does:** Next.js plugin to generate `llms.txt` / `llms-full.txt` at build time. Per-page Markdown endpoints.
- **Strengths:** Clean, focused, mature implementation. Good reference for the llms.txt slice.
- **Gaps:** Single feature. No semantic graph, no actions, no MCP.
- **Verdict:** **Reference implementation** for `@next-ai-ready/llms`. We borrow patterns; we go much wider.

### 3. `fumadocs` (with `fumadocs-mdx`)
- **Repo:** https://github.com/fuma-nama/fumadocs · **Docs:** https://fumadocs.dev/
- **What it does:** Modern docs site framework. Recently added `llms.txt` generation + raw MDX serving via Loader API + processed Markdown content.
- **Strengths:** Best-in-class MDX → AI-ready content pipeline. Excellent DX.
- **Gaps:** It's a **docs site framework**, not a general layer. To get its AI features, you have to adopt fumadocs entirely. No Capability plane.
- **Verdict:** Aspirational benchmark for our MDX compiler. We aim for **comparable Knowledge quality on any Next.js app**, not just docs sites.

### 4. `chikodilee/aeo-site`, `ai-search-guru/getcito`
- Smaller AEO-focused tools, mostly auditing / scoring oriented.
- **Verdict:** Confirms a `doctor` CLI is a valuable feature; nobody has merged auditing + framework integration.

## Adjacent — we will USE these, not compete

### 5. `vercel/mcp-handler` ⭐ critical dependency
- **Repo:** https://github.com/vercel/mcp-handler
- **What it does:** Official Vercel adapter that turns a Next.js / Nuxt / Svelte route into an MCP server. Supports Streamable HTTP and SSE.
- **Verdict:** **Use as-is for MCP transport.** Our `@next-ai-ready/mcp` package becomes a thin layer that hands our `ActionRegistry` to `mcp-handler` and exposes our SemanticGraph as MCP resources. Massive scope reduction.

### 6. `next-openapi-gen` / `next-rest-framework` / `next-openapi-route-handler`
- Zod-driven OpenAPI generation for Next.js route handlers.
- **Verdict:** We don't depend on them (our generator is simpler because we only emit one operation per registered action). But they validate the API shape and prove the Zod → OpenAPI pipeline. Our `@next-ai-ready/openapi` can borrow the Zod → JSON Schema choice (likely `zod-to-json-schema` or Zod 4 native).

### 7. `AnswerDotAI/llms-txt` — the spec
- **Repo:** https://github.com/AnswerDotAI/llms-txt
- **Verdict:** This is the canonical `llms.txt` specification. We follow it strictly.

### 8. Vercel AI SDK
- **Verdict:** Solves "use AI **in** your site". We solve "let AI **use** your site". Orthogonal; both can coexist.

## Adjacent — Next.js itself

### 9. Next.js 16 built-in MCP at `/_next/mcp`
- **Docs:** https://nextjs.org/docs/app/guides/mcp
- **What it is:** Built-in MCP endpoint in Next 16 dev server. Combined with `vercel/next-devtools-mcp`, exposes HMR errors, build diagnostics, runtime logs to **coding agents** (Cursor, Claude Code, etc.).
- **Why it matters to us:**
  - **Scope is different.** This is **dev-time, dev-diagnostics MCP** for the agent writing your code. We do **production-time, business-capability MCP** for the agent using your site.
  - **It validates the bet.** MCP being a first-class Next.js feature means our model (Next site → MCP server) is canon, not fringe.
  - **Naming caution.** We must avoid colliding with `/_next/mcp`. Our endpoint defaults to `/api/mcp`.

### 10. Next.js community discussions on llms.txt
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
