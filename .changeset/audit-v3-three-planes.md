---
"@next-ai-ready/next": minor
"next-ai-ready": minor
---

Add opt-in Audit v3 with independent Agent Readability, Semantic/AEO Quality,
and Agent Capability planes. Readability preflight checks use strict
required/recommended tier scoring while the official Vercel CLI remains the
external quality gate. Audit v1 and v2 remain unchanged.
Vercel-compatible missing-page Markdown is scored separately from the stricter
noindex and recovery-link quality enhancement.
Generate dynamic route wrappers that pass Next.js 14, 15, and 16 production
route validation.
Freeze the 0.1 public entrypoints, runtime exports, TypeScript declarations,
and CLI bins behind an explicit compatibility check.
Report an unconfigured production MCP token as service unavailable and surface
that deployment error separately from invalid client credentials in Audit v3.
