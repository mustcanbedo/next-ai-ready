# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.6] - 2026-06-01

### ⚠️ Breaking Changes

#### `@next-ai-ready/openapi`

- **`buildToolsJson()` signature change** — Removed unused `_site: SiteInfo` parameter.
  - Before: `buildToolsJson(manifest, site)`
  - After: `buildToolsJson(manifest)`
  - Migration: Remove the second argument from your calls.

#### `@next-ai-ready/actions`

- **Zod v4 required** — `isZodSchema()` now only accepts Zod v4 schemas (with `_zod` property).
  - Zod v3 schemas (with `_def` only) are no longer supported.
  - Migration: Upgrade to `zod@^4`.

#### Import Path Changes

- **Config imports** — Template files now import from `next-ai-ready` (meta package) instead of `@next-ai-ready/actions`:
  - Before: `import { defineAction } from "@next-ai-ready/actions"`
  - After: `import { defineAction } from "next-ai-ready"`
  - Migration: Update your import statements.

### ✨ Added

#### `@next-ai-ready/core`

- **Locale support (P6-06)** — Added `locale.ts` with `parseLocaleFromRoute()`, `stripLocaleFromRoute()`, and `buildRoutesByLocale()`.
- **Content source abstraction (P6-02)** — Added `ContentSource` interface and `filesystemContentSource()` default implementation.
- **Embeddings support (P6-03)** — Added `EmbeddingsProvider` and `EmbeddingsConfig` types.
- **`SemanticConfig` type** — Aggregated `chunk`, `extract`, and `embeddings` config.
- **`actionsModulePath()` branded type** — Type-safe relative paths for action modules.

#### `@next-ai-ready/next`

- **`dev` command** — Watch content globs and rebuild AI artifacts on change (`next-ai-ready dev`).
- **`doctor --json` flag** — Emit machine-readable JSON report with 24 tactics evaluation.
- **`doctor --score` flag** — Include AI-readiness score (0–100) in output.
- **Structured errors** — `AiReadyError` class with error codes and action items.
- **Next.js 15 params support** — `resolveParams()` helper for async params.

#### `@next-ai-ready/semantic`

- **`routesByLocale`** — Graph now includes locale → routes index when locale-prefixed routes are detected.
- **Deep walk with depth limit** — `getPageNodes()` now traverses all descendants (not just direct children) with a 100-depth safety limit.

#### `@next-ai-ready/mcp`

- **URI utility functions** — `mcpPageUri()` and `routeFromMcpPageUri()` for consistent MCP resource URI handling.
- **Exported `MCP_PAGE_URI_PREFIX`** constant.

### 🔧 Changed

#### `@next-ai-ready/core`

- **`parseLocaleFromRoute()` now uses whitelist** — Only matches known ISO 639-1 locales to prevent false positives (e.g., `/api`, `/app`).

#### `@next-ai-ready/next`

- **`jiti` is now optional peer dependency** — Moved from `dependencies` to `peerDependencies` with `optional: true`. Install `jiti` if you use TypeScript config files (`ai-ready.config.ts`).
- **MCP auth uses `timingSafeEqual`** — Token comparison now uses timing-safe comparison from `node:crypto`.
- **`dev.ts` uses loop instead of recursion** — Prevents potential stack overflow on rapid file changes.

#### `@next-ai-ready/openapi`

- **`buildAiPlugin()` default path** — Changed from `/api/openapi.json` to `/openapi.json`.

### 🐛 Fixed

- **`aiRobots()` extra config** — Now warns when `extra` rules are passed (not supported in structured format).
- **`doctor` add() name parameter** — Made `name` parameter required for all diagnostic checks.

### 📚 Documentation

- Added **Known limitations** section to README.
- Added **Package layout** explanation to README.
- Updated **REVIEW.md** to point to `docs/completion-audit.md` and `docs/backlog.md`.

---

## [0.1.0-alpha.5] - Previous release

See git history for changes.

[Unreleased]: https://github.com/anthropics/next-ai-ready/compare/v0.1.0-alpha.6...HEAD
[0.1.0-alpha.6]: https://github.com/anthropics/next-ai-ready/compare/v0.1.0-alpha.5...v0.1.0-alpha.6
[0.1.0-alpha.5]: https://github.com/anthropics/next-ai-ready/releases/tag/v0.1.0-alpha.5
