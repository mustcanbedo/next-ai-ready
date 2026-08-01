# Get started in 10 minutes

This guide gets a new Next.js App Router project AI-ready with `next-ai-ready@alpha`.

## Prerequisites

- Node.js 20+
- Next.js 15+ (App Router)
- Zod v4 (`zod@^4`) if you define actions

## 1. Scaffold (recommended)

```bash
npm create next-ai-ready@alpha my-app
cd my-app
npm install
npx next-ai-ready init
```

The scaffold creates a runnable minimal Next.js App Router TypeScript app, including `app/layout.tsx`, `app/page.tsx`, and starter `content/index.mdx`. It does not pre-generate AI-ready config or handlers; `next-ai-ready init` adds those files and wiring after dependencies are installed.

## 2. Configure your site

Edit `ai-ready.config.mjs`:

```js
import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com", // production URL, no trailing slash
    description: "One sentence for AI search and llms.txt.",
  },
  content: ["content/**/*.mdx"], // globs scanned at build time
  actions: "./actions/index.mjs",   // optional Capability plane
});
```

Ensure `next.config` wraps your config with `withAiReady()` ( `init` does this when missing).

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

`prebuild` ensures `public/llms.txt`, `.next-ai-ready/graph.json`, and OpenAPI artifacts exist before Next.js builds.

## 4. Add content (Knowledge plane)

Create `content/docs/intro.mdx`:

```mdx
export const semantic = {
  summary: "What this product does in one line.",
  questions: [
    { q: "What is My Site?", a: "A short answer for AI citations." },
  ],
}

# Introduction

Your page body here.
```

Run:

```bash
npx next-ai-ready build
npm run dev
```

## 5. Verify AI endpoints

Open or curl:

| URL | Purpose |
|-----|---------|
| `/llms.txt` | Site index for LLMs |
| `/llms-full.txt` | Full content dump (includes FAQ when present) |
| `/docs/intro.md` | Per-page Markdown (route matches your graph) |
| `/openapi.json` | Agent API spec |
| `/tools.json` | Tool definitions |

## 6. Run doctor

```bash
npx next-ai-ready doctor --score
```

Aim for **90+**. Common fixes to reach **100**:

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

- [Live docs](https://next-ai-ready.vercel.app/en)
- [`architecture.md`](./architecture.md)
- [`goals.md`](./goals.md) — 24 AEO tactics
