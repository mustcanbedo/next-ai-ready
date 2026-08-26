---
"@next-ai-ready/llms": patch
"@next-ai-ready/next": patch
"next-ai-ready": patch
---

Derive the `llms.txt` freshness marker from page `updatedAt` metadata instead
of the build timestamp, preventing committed AI artifacts from drifting when
the same content is rebuilt on a later date.
