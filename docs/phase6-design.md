# Phase 6 — Post-MVP

> Status: **foundation shipped in alpha.7** (2026-06-01). See implementation below.

## P6-01 — LLM `SemanticProvider` ✅

`SemanticProvider.enrich()` + `summarize()` run at build time when `semantic.extract.summary` is a provider object.

## P6-02 — Content source adapters ✅

`defineContentSource()` + `filesystemContentSource()` in `@next-ai-ready/core`. Set `contentSource` on config for custom adapters.

## P6-03 — Embedding-ready chunks ✅

`semantic.embeddings.provider.embed()` populates `chunk.embedding[]` at build time.

## P6-04 — Edge runtime ✅ (fetch loader)

`loadGraphFromFetch()` / `createEdgeGraphLoader()` exported from `@next-ai-ready/next`. Full Edge handlers still require bundler work.

## P6-05 — Rate-limit / auth recipes ✅

`examples/recipes/upstash-ratelimit/README.md`

## P6-06 — Multi-language SemanticGraph ✅

`SemanticNode.locale`, `SemanticGraph.routesByLocale`, `parseLocaleFromRoute()` helpers.

## P6-07 — Tool manifest preview UI ✅

`examples/tool-preview/index.html`

## Future

- Native Edge route handlers without Node fs
- First-party fumadocs/velite adapters
- Hosted embedding providers in core
