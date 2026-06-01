---
"next-ai-ready": patch
"@next-ai-ready/core": patch
"@next-ai-ready/next": patch
"@next-ai-ready/actions": patch
"@next-ai-ready/semantic": patch
"@next-ai-ready/mdx": patch
"@next-ai-ready/llms": patch
"@next-ai-ready/openapi": patch
"@next-ai-ready/mcp": patch
---

Fix npm publish: use pnpm publish so workspace:* resolves to semver (alpha.8 was broken on registry).
