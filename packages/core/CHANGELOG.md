# @next-ai-ready/core

## 0.1.0-alpha.13

### Patch Changes

- b972b61: Add searchable npm metadata, repository links, and a release-time metadata gate for every public package. The alpha release workflow can now explicitly promote verified user-facing packages to the `latest` dist-tag.

## 0.1.0-alpha.12

### Patch Changes

- 5a45ab0: Publish the focused Core runtime subpaths and the `@next-ai-ready/semantic/jsonld` export already used by the Next.js runtime entrypoints.

## 0.1.0-alpha.11

### Patch Changes

- f3d8a99: Adopter UX: llms-full FAQ sections, doctor robots.ts + emit.robots fix, Top fixes actionItems, docs hub and GA/post-GA guides.
- db3a892: Generate AI route handlers under `app/%5Fai-ready` so Next.js registers the `/_ai-ready/*` URL namespace instead of treating the directory as private. Add opt-in Markdown content negotiation, canonical Markdown response headers, and `sitemap.md` generation for agent-readable delivery.

## 0.1.0-alpha.9

### Patch Changes

- Fix npm publish: use pnpm publish so workspace:\* resolves to semver (alpha.8 was broken on registry).

## 0.1.0-alpha.8

### Patch Changes

- 4aaaf1d: Phase 6 foundation: locale graph, content sources, embeddings, SemanticProvider hook, Edge fetch loader, recipes + tool preview. C-\* refactors complete.
