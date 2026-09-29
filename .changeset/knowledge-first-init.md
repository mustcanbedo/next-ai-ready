---
"next-ai-ready": patch
"@next-ai-ready/next": patch
---

Make `next-ai-ready init` scaffold the Knowledge Plane by default and add
`--with-capabilities` for Actions, MCP, OpenAPI routes, and observability.
Enable Agent Markdown negotiation in generated Next.js config and stop doctor
from penalizing intentionally Knowledge-only projects for missing capability
configuration or MCP credentials. Capability setup remains explicit about its
Zod and MCP peer dependencies.
