---
"@next-ai-ready/next": patch
"next-ai-ready": patch
"@next-ai-ready/llms": patch
"@next-ai-ready/core": patch
---

Generate AI route handlers under `app/%5Fai-ready` so Next.js registers the `/_ai-ready/*` URL namespace instead of treating the directory as private. Add opt-in Markdown content negotiation, canonical Markdown response headers, and `sitemap.md` generation for agent-readable delivery.
