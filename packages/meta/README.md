# next-ai-ready

One-line install for the full next-ai-ready stack.

```bash
pnpm add next-ai-ready@alpha
npx next-ai-ready init
```

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

- `next-ai-ready` — authoring and build-time helpers
- `next-ai-ready/config` — `withAiReady()`
- `next-ai-ready/robots` — dynamic robots helpers
- `next-ai-ready/hooks` — runtime observability
- `next-ai-ready/handlers/*` — App Router handlers
- `next-ai-ready/audit` — programmatic deployment audit

Focused subpaths keep CLI and content-scanning dependencies out of Next.js runtime bundles.
