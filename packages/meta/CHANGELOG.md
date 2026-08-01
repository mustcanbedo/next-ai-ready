# next-ai-ready

## 0.1.0-alpha.12

### Patch Changes

- 8d0f5df: Return a noindex Markdown recovery document for missing agent-readable pages while
  preserving browser HTML 404 semantics. Harden the deployed audit so it verifies
  both paths independently and accepts standards-compatible negotiation metadata.
- Updated dependencies [8d0f5df]
  - @next-ai-ready/llms@0.1.0-alpha.12
  - @next-ai-ready/next@0.1.0-alpha.12

## 0.1.0-alpha.11

### Minor Changes

- 71cd7c4: Add `next-ai-ready audit <url>` to score the deployed HTML, discovery files,
  Markdown negotiation, response metadata, structured data, and real 404 behavior.
  The command supports human-readable and JSON output and exits non-zero for
  required check failures, making it suitable for post-deployment CI gates.

### Patch Changes

- f3d8a99: Adopter UX: llms-full FAQ sections, doctor robots.ts + emit.robots fix, Top fixes actionItems, docs hub and GA/post-GA guides.
- db3a892: Generate AI route handlers under `app/%5Fai-ready` so Next.js registers the `/_ai-ready/*` URL namespace instead of treating the directory as private. Add opt-in Markdown content negotiation, canonical Markdown response headers, and `sitemap.md` generation for agent-readable delivery.
- Updated dependencies [f3d8a99]
- Updated dependencies [71cd7c4]
- Updated dependencies [db3a892]
  - @next-ai-ready/llms@0.1.0-alpha.11
  - @next-ai-ready/next@0.1.0-alpha.11
  - @next-ai-ready/core@0.1.0-alpha.11
  - @next-ai-ready/mdx@0.1.0-alpha.11
  - @next-ai-ready/semantic@0.1.0-alpha.11
  - @next-ai-ready/actions@0.1.0-alpha.11
  - @next-ai-ready/openapi@0.1.0-alpha.11
  - @next-ai-ready/mcp@0.1.0-alpha.11

## 0.1.0-alpha.9

### Patch Changes

- Fix npm publish: use pnpm publish so workspace:\* resolves to semver (alpha.8 was broken on registry).
- Updated dependencies
  - @next-ai-ready/core@0.1.0-alpha.9
  - @next-ai-ready/next@0.1.0-alpha.9
  - @next-ai-ready/actions@0.1.0-alpha.9
  - @next-ai-ready/semantic@0.1.0-alpha.9
  - @next-ai-ready/mdx@0.1.0-alpha.9
  - @next-ai-ready/llms@0.1.0-alpha.9
  - @next-ai-ready/openapi@0.1.0-alpha.9
  - @next-ai-ready/mcp@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- 4aaaf1d: Phase 6 foundation: locale graph, content sources, embeddings, SemanticProvider hook, Edge fetch loader, recipes + tool preview. C-\* refactors complete.
- Updated dependencies [4aaaf1d]
  - @next-ai-ready/core@0.1.0-alpha.8
  - @next-ai-ready/next@0.1.0-alpha.8
  - @next-ai-ready/semantic@0.1.0-alpha.8
  - @next-ai-ready/mdx@0.1.0-alpha.8
  - @next-ai-ready/mcp@0.1.0-alpha.8
  - @next-ai-ready/actions@0.1.0-alpha.8
  - @next-ai-ready/llms@0.1.0-alpha.8
  - @next-ai-ready/openapi@0.1.0-alpha.8
