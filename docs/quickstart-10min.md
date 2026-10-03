# Get started in 10 minutes

This guide verifies the Knowledge Plane in a Next.js App Router project. Allow about ten
minutes, plus dependency downloads and the production build; actions and MCP are optional.

## Prerequisites

- Node.js 20+
- Next.js 14.2+ (App Router); the scaffold uses Next.js 15
- Zod v4 (`zod@^4`) if you define actions

## 1. Scaffold (recommended)

```bash
npm create next-ai-ready@latest my-app
cd my-app
npm install
npx next-ai-ready init
```

The scaffold creates a runnable minimal Next.js App Router TypeScript app, including `app/layout.tsx`, `app/page.tsx`, and starter `content/index.mdx`. It does not pre-generate AI-ready config or handlers; `next-ai-ready init` adds those files and wiring after dependencies are installed.

## 2. Configure your site

Edit the existing `ai-ready.config.ts` or `ai-ready.config.mjs`. Replace the example identity and
origin with your real production values; do not create a second config or deploy the placeholder:

```js
import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com", // production URL, no trailing slash
    description: "One sentence for AI search and llms.txt.",
  },
  content: ["content/**/*.mdx"], // globs scanned at build time
});
```

Ensure `next.config` wraps your config with `withAiReady({ agentReadable: true })` (`init` does this when missing).
When a real callable workflow is ready, install Zod and the MCP peer packages, then run
`next-ai-ready init --with-capabilities`; the command creates the capability routes and adds
the generated actions module to this config.

## 3. Wire the build

In `package.json`:

```json
{
  "scripts": {
    "prebuild": "next-ai-ready build",
    "build": "next build",
    "dev": "next dev"
  }
}
```

`init` adds build wiring when missing. Keep existing scripts rather than replacing them with this
example. The AI build writes `public/llms.txt` and `.next-ai-ready/graph.json`; OpenAPI is optional.

## 4. Add content (Knowledge plane)

Create `content/docs/intro.mdx`:

```markdown
---
title: Introduction
summary: Install dependencies for the example project.
---

# Introduction

Run `pnpm install` from the application root to install dependencies.
```

Run:

```bash
npx next-ai-ready build
npm run build
npm run start
```

## 5. Verify AI endpoints

In another terminal, inspect the response headers and bodies:

```bash
curl -i http://localhost:3000/llms.txt
curl -i http://localhost:3000/docs/intro.md
curl -i -H 'Accept: text/html' http://localhost:3000/
```

The discovery index must include the configured `/docs/intro` link; the page endpoint must return
`200`, `text/markdown`, the `Introduction` title and the dependency instructions. HTTP `200` with
`document_status: "not_found"` is a recovery document, not successful retrieval. A normal `/`
request must still return HTML. Adding an MDX source under `content/` does not create an HTML route.

| URL | Purpose |
|-----|---------|
| `/llms.txt` | Site index for LLMs |
| `/llms-full.txt` | Full content dump (includes FAQ when present) |
| `/docs/intro.md` | Per-page Markdown (route matches your graph) |

`/openapi.json`, `/tools.json`, and MCP require explicit Capability setup; they are not part of
default `init` or this acceptance check.

## 6. Run doctor

```bash
npx next-ai-ready doctor --score
```

Require **0 errors**, then resolve or record warnings. A high score cannot replace the HTTP
checks above. Public alpha.21 incorrectly warns about missing OpenAPI in Knowledge-only projects;
that diagnostic fix is pending release. Do not enable capabilities just to silence it.

Other warnings may need these changes:

| Warning | Fix |
|---------|-----|
| Missing `prebuild` / build script | Add `"prebuild": "next-ai-ready build"` |
| No `public/robots.txt` | Run `build`, or use `app/robots.ts` + `emit.robots: false` |
| `NEXT_AI_READY_MCP_TOKEN` unset | Set in production if you expose `/api/mcp` |
| Missing `updatedAt` / `author` | Add to MDX frontmatter |
| No JSON-LD in app | Use `getPageJsonLd()` / `getSiteJsonLd()` in layouts |
| Public actions without `whenToUse` | Add `whenToUse` on each public action |

Doctor prints **Top fixes** when you pass `--score`.

## 7. Optional: MCP in production

```bash
# .env.production
NEXT_AI_READY_MCP_TOKEN=your-secret-token
```

Clients call `/api/mcp` with `Authorization: Bearer <token>`.

## Already have a Next.js site (TSX pages)?

**A. Migrate docs to MDX (recommended)**  
Move documentation into `content/**/*.mdx` and keep marketing pages as TSX. One source file per AI route.

**B. Dual-track (docs-site pattern)**  
Keep TSX for UI; maintain parallel MDX under `content/` for the Knowledge plane. See [`examples/docs-site/README.md`](../examples/docs-site/README.md).

**C. Custom content source (experimental)**  
`defineContentSource()` and Phase 6 adapters — see [`phase6-design.md`](./phase6-design.md).

## Limits (read before production)

- Zod v4 only for actions
- Handlers use `runtime = "nodejs"` (not Edge)
- No `output: 'export'` static export
- App Router only (no Pages Router)

## Next steps

- [Live docs](https://nextaiready.com/en)
- [`architecture.md`](./architecture.md)
- [`goals.md`](./goals.md) — 24 AEO tactics
