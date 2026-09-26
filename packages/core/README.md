# @next-ai-ready/core

Type contract and shared utilities for the next-ai-ready stack.

- `defineConfig()` / `AiReadyConfig` — project configuration
- `scanContent()` / `fileToRoute()` — content discovery
- `SiteInfo`, `SemanticGraph`, `SemanticNode` — knowledge plane types
- `buildRobotsTxt()`, `aiRobots()` — crawler policy helpers
- `identifyAiBot()` — AI bot user-agent matching

Crawler access can be decided by purpose without adding a model dependency:

```ts
robots: {
  aiBots: {
    search: "allow",
    training: "disallow",
    user: "allow",
    other: "disallow",
  },
}
```

The string form `aiBots: "allow" | "disallow"` remains supported.

Part of [next-ai-ready](../../README.md). Pre-alpha; use the package registry as
the source of truth for the published version.
