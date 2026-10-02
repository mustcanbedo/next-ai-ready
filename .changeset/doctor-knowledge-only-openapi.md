---
"@next-ai-ready/next": patch
"next-ai-ready": patch
---

Stop doctor from warning about missing OpenAPI artifacts in valid Knowledge-only
projects or suggesting optional capability output in Top fixes. Keep the
existing OpenAPI check ID, score weight, and missing-artifact warning when
actions are configured or OpenAPI, AI plugin, Tools, Actions, or MCP route stubs are
installed, including empty actions and action modules that fail to load.

Recognize JavaScript and TypeScript route file variants and conservatively detect
existing `.mjs` files for diagnostics, without claiming Next.js supports `.mjs`
routes. Use the same file detection for MCP token checks so missing production
credentials remain visible.
