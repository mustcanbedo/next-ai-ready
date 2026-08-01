---
"@next-ai-ready/next": patch
"next-ai-ready": patch
---

Initialize the optional MCP HTTP adapter on the first request instead of at
module evaluation time, so a default scaffold can build without installing
`mcp-handler` until the MCP endpoint is actually used.
