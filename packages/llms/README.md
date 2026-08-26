# @next-ai-ready/llms

Renders `llms.txt`, `llms-full.txt`, per-route `.md` and `.ai.json` from a SemanticGraph, including deterministic missing-page recovery documents and relevant-page suggestions. The `llms.txt` freshness marker is derived from the newest page `updatedAt` value, so identical content produces identical output across build dates.

Part of [next-ai-ready](../../README.md). Pre-alpha.
