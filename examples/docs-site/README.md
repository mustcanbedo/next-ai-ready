# next-ai-ready documentation site

Dogfood example for the [next-ai-ready](https://github.com/next-ai-ready/next-ai-ready) framework. This Next.js app demonstrates Knowledge + Capability planes with bilingual docs (en/zh).

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm build
cd examples/docs-site
pnpm dev
```

**Production URL:** [next-ai-ready.vercel.app](https://next-ai-ready.vercel.app/en)

Optional env (Vercel → Settings → Environment Variables):

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Override `baseUrl` for llms/openapi metadata (defaults to `https://next-ai-ready.vercel.app`) |
| `NEXT_AI_READY_MCP_TOKEN` | Bearer token for `/api/mcp` in production |

AI endpoints (after `next-ai-ready build` / prebuild):

- `/llms.txt`, `/openapi.json`, `/tools.json`
- `POST /api/actions/<name>` — demo actions: `search_docs`, `get_page_content`, `list_api_methods`
- `/api/mcp` — MCP HTTP transport

## Structure

| Path | Purpose |
|------|---------|
| `content/{en,zh}/docs/` | MDX scanned by `next-ai-ready build` (routes match `/en/docs/...` UI paths) |
| `ai-ready.config.mjs` | Framework config |
| `app/_ai-ready/**` | Thin handler re-exports |
| `actions/` | Demo Capability-plane actions |
| `instrumentation.ts` | Edge-safe entry — loads Node hooks when `NEXT_RUNTIME === "nodejs"` |
| `instrumentation-node.ts` | `registerAiHooks` via `next-ai-ready/hooks` |

Site UI reads MDX via `lib/docs.ts` (dual-track); AI artifacts come from the framework build pipeline.

## Dual-track architecture

This site intentionally uses **two pipelines** from the same MDX files:

| Track | Code | What it powers |
|-------|------|----------------|
| **UI** | `lib/docs.ts` + `MdxContent` | Sidebar, doc pages, marketing layout |
| **AI** | `next-ai-ready build` → graph + `public/*` | `/llms.txt`, JSON-LD, OpenAPI, MCP, actions |

Important:

- **UI rendering is not full MDX.** `MdxContent` is a lightweight Markdown subset (headings, lists, code, tables). It does not execute MDX exports or React components.
- **AI extraction uses the framework compiler** (`@next-ai-ready/mdx`). Frontmatter fields like `summary`, `questions`, and `tags` feed the semantic graph.
- Content lives under `content/{locale}/docs/**` so scanner routes (`/en/docs/introduction`) match App Router URLs.

When editing docs, verify both:

1. `pnpm dev` — page looks correct in the browser
2. `node ../../packages/meta/dist/cli.js build && node ../../packages/meta/dist/cli.js doctor --score` — AI artifacts stay healthy

## Smoke test

From `examples/docs-site`:

```bash
node scripts/docs-site-smoke.mjs
```

Runs build artifact checks (URLs, OpenAPI route hints, curated llms sections) and prints doctor score.

See [`docs/pre-docs-site-checklist.md`](../../docs/pre-docs-site-checklist.md) for the full dogfood checklist.
