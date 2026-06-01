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

AI endpoints (after `next-ai-ready build` / prebuild):

- `/llms.txt`, `/openapi.json`, `/tools.json`
- `POST /api/actions/<name>` — demo actions: `search_docs`, `get_page_content`, `list_api_methods`
- `/api/mcp` — MCP HTTP transport

## Structure

| Path | Purpose |
|------|---------|
| `content/{en,zh}/` | MDX scanned by `next-ai-ready build` |
| `ai-ready.config.mjs` | Framework config |
| `app/_ai-ready/**` | Thin handler re-exports |
| `actions/` | Demo Capability-plane actions |
| `instrumentation.ts` | Edge-safe entry — loads Node hooks when `NEXT_RUNTIME === "nodejs"` |
| `instrumentation-node.ts` | `registerAiHooks` via `next-ai-ready/hooks` |

Site UI reads MDX via `lib/docs.ts` (dual-track); AI artifacts come from the framework build pipeline.

See [`docs/pre-docs-site-checklist.md`](../../docs/pre-docs-site-checklist.md) for the full dogfood checklist.
