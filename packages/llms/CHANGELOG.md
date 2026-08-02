# @next-ai-ready/llms

## 0.1.0-alpha.15

### Patch Changes

- Updated dependencies [45b6c33]
  - @next-ai-ready/core@0.1.0-alpha.14
  - @next-ai-ready/semantic@0.1.0-alpha.14

## 0.1.0-alpha.14

### Patch Changes

- b972b61: Add searchable npm metadata, repository links, and a release-time metadata gate for every public package. The alpha release workflow can now explicitly promote verified user-facing packages to the `latest` dist-tag.
- Updated dependencies [b972b61]
  - @next-ai-ready/core@0.1.0-alpha.13
  - @next-ai-ready/semantic@0.1.0-alpha.13

## 0.1.0-alpha.13

### Patch Changes

- Updated dependencies [5a45ab0]
  - @next-ai-ready/semantic@0.1.0-alpha.12
  - @next-ai-ready/core@0.1.0-alpha.12

## 0.1.0-alpha.12

### Patch Changes

- 8d0f5df: Return a noindex Markdown recovery document for missing agent-readable pages while
  preserving browser HTML 404 semantics. Harden the deployed audit so it verifies
  both paths independently and accepts standards-compatible negotiation metadata.

## 0.1.0-alpha.11

### Patch Changes

- f3d8a99: Adopter UX: llms-full FAQ sections, doctor robots.ts + emit.robots fix, Top fixes actionItems, docs hub and GA/post-GA guides.
- db3a892: Generate AI route handlers under `app/%5Fai-ready` so Next.js registers the `/_ai-ready/*` URL namespace instead of treating the directory as private. Add opt-in Markdown content negotiation, canonical Markdown response headers, and `sitemap.md` generation for agent-readable delivery.
- Updated dependencies [f3d8a99]
- Updated dependencies [db3a892]
  - @next-ai-ready/core@0.1.0-alpha.11
  - @next-ai-ready/semantic@0.1.0-alpha.11

## 0.1.0-alpha.9

### Patch Changes

- Fix npm publish: use pnpm publish so workspace:\* resolves to semver (alpha.8 was broken on registry).
- Updated dependencies
  - @next-ai-ready/core@0.1.0-alpha.9
  - @next-ai-ready/semantic@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- Updated dependencies [4aaaf1d]
  - @next-ai-ready/core@0.1.0-alpha.8
  - @next-ai-ready/semantic@0.1.0-alpha.8
