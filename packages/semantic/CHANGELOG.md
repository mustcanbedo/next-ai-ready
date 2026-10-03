# @next-ai-ready/semantic

## 0.1.0-alpha.16

### Patch Changes

- 980abbf: Publish the canonical nextaiready.com homepage metadata already present in the
  workspace manifests. The existing published versions of these seven packages
  still point to the previous Vercel origin. This is a metadata correction, not a
  runtime API change or a claim that all package dist-tags have been promoted.
- fd5937d: Build JSON-LD breadcrumbs from existing SemanticGraph pages instead of inventing parent URLs from route segments. Use page titles and canonical citation URLs, skip missing ancestors and duplicate canonical URLs, and normalize the site base URL.
- Updated dependencies [980abbf]
  - @next-ai-ready/core@0.1.0-alpha.16

## 0.1.0-alpha.15

### Minor Changes

- 886deef: Add a public, replaceable `PageSearchProvider` and make MCP and HTTP page
  search share the same deterministic graph ranking implementation.

### Patch Changes

- Updated dependencies [e0f93dd]
  - @next-ai-ready/core@0.1.0-alpha.15

## 0.1.0-alpha.14

### Patch Changes

- Updated dependencies [45b6c33]
  - @next-ai-ready/core@0.1.0-alpha.14

## 0.1.0-alpha.13

### Patch Changes

- b972b61: Add searchable npm metadata, repository links, and a release-time metadata gate for every public package. The alpha release workflow can now explicitly promote verified user-facing packages to the `latest` dist-tag.
- Updated dependencies [b972b61]
  - @next-ai-ready/core@0.1.0-alpha.13

## 0.1.0-alpha.12

### Patch Changes

- 5a45ab0: Publish the focused Core runtime subpaths and the `@next-ai-ready/semantic/jsonld` export already used by the Next.js runtime entrypoints.
- Updated dependencies [5a45ab0]
  - @next-ai-ready/core@0.1.0-alpha.12

## 0.1.0-alpha.11

### Patch Changes

- f3d8a99: Adopter UX: llms-full FAQ sections, doctor robots.ts + emit.robots fix, Top fixes actionItems, docs hub and GA/post-GA guides.
- Updated dependencies [f3d8a99]
- Updated dependencies [db3a892]
  - @next-ai-ready/core@0.1.0-alpha.11

## 0.1.0-alpha.9

### Patch Changes

- Fix npm publish: use pnpm publish so workspace:\* resolves to semver (alpha.8 was broken on registry).
- Updated dependencies
  - @next-ai-ready/core@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- 4aaaf1d: Phase 6 foundation: locale graph, content sources, embeddings, SemanticProvider hook, Edge fetch loader, recipes + tool preview. C-\* refactors complete.
- Updated dependencies [4aaaf1d]
  - @next-ai-ready/core@0.1.0-alpha.8
