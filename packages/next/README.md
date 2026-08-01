# @next-ai-ready/next

Next.js integration: `withAiReady()`, route handlers, and CLI (`build`, `init`, `doctor`, `audit`, `dev`, `mcp`). Missing Markdown pages return a noindex recovery document while browser HTML 404 behavior remains unchanged.

## Versioned deployment audit

`next-ai-ready audit <url>` defaults to report schema v1, preserving the existing JSON fields, score, and CI exit behavior. Audit v2 keeps its original five weighted dimensions. Use `next-ai-ready audit <url> --version 3 --json` for the opt-in `next-ai-ready.audit.v3` schema with independent Agent Readability, Semantic/AEO Quality, and Agent Capability planes. V3 is a local subset preflight with strict pass-only tier scoring; the official Vercel CLI remains the external source of truth.

The programmatic API follows the same compatibility rule:

```ts
import { runAudit } from "next-ai-ready/audit"

const v1 = await runAudit(url)
const v2 = await runAudit(url, { version: "2" })
const v3 = await runAudit(url, { version: "3" })
```

Consumer apps should install **`next-ai-ready`** (meta) instead of this package directly.

Part of [next-ai-ready](../../README.md). Pre-alpha.
