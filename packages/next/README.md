# @next-ai-ready/next

Next.js integration: `withAiReady()`, route handlers, and CLI (`build`, `init`, `doctor`, `audit`, `dev`, `mcp`). Missing Markdown pages return a noindex recovery document while browser HTML 404 behavior remains unchanged.

## Versioned deployment audit

`next-ai-ready audit <url>` defaults to report schema v1, preserving the existing JSON fields, score, and CI exit behavior. Use `next-ai-ready audit <url> --version 2 --json` for the opt-in `next-ai-ready.audit.v2` schema with five independently weighted dimensions: discovery (20%), content and citation (25%), structured data (15%), agent access (30%), and capabilities (10%). Every non-passing v2 check includes a targeted recommendation.

The programmatic API follows the same compatibility rule:

```ts
const v1 = await runAudit(url)
const v2 = await runAudit(url, { version: "2" })
```

Consumer apps should install **`next-ai-ready`** (meta) instead of this package directly.

Part of [next-ai-ready](../../README.md). Pre-alpha.
