# next-ai-ready

Generate `llms.txt`, per-page Markdown and structured data from existing content in a Next.js App Router project, without replacing its UI.

Currently alpha. The default setup is Knowledge-only; agent actions and MCP are opt-in.

```bash
pnpm add next-ai-ready@alpha
npx next-ai-ready init
```

**Install and verify:** [English](https://nextaiready.com/en/docs/installation) | [中文](https://nextaiready.com/zh/docs/installation)

**Next.js llms.txt walkthrough:** [English](https://nextaiready.com/en/docs/guides/nextjs-llms-txt) | [中文](https://nextaiready.com/zh/docs/guides/nextjs-llms-txt)

See the [project README](../../README.md) for the full picture.

## Public entrypoints

Consumer apps should install only this package. Use focused subpaths in Next.js runtime and configuration files:

```js
// next.config.mjs
import { withAiReady } from "next-ai-ready/config"
```

```ts
// app/robots.ts
import { aiRobots } from "next-ai-ready/robots"
```

Keep AI search visible while opting out of model-training crawlers:

```ts
export default aiRobots(
  { name: "Acme", baseUrl: "https://acme.com" },
  {
    aiBots: {
      search: "allow",
      training: "disallow",
      user: "allow",
      other: "disallow",
    },
  },
)
```

- `next-ai-ready` — authoring and build-time helpers
- `next-ai-ready/config` — `withAiReady()`
- `next-ai-ready/robots` — dynamic robots helpers
- `next-ai-ready/hooks` — runtime observability
- `next-ai-ready/handlers/*` — App Router handlers
- `next-ai-ready/audit` — programmatic deployment audit

Focused subpaths keep CLI and content-scanning dependencies out of Next.js runtime bundles.
