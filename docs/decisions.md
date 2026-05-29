# Architecture Decision Records (ADR)

Decisions that shape the project. Each entry is dated and immutable once accepted — supersede via a new ADR.

---

## ADR-001 — Toolchain: pnpm + turbo + tsup + vitest + changesets
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Use pnpm workspaces, Turbo for task orchestration, tsup (esbuild) for package builds, Vitest for tests, Changesets for versioning.

**Rationale:**
- pnpm is the de-facto monorepo PM (strict isolation, hard links).
- Turbo provides remote cache + task graph; nx is heavier and more opinionated.
- tsup produces ESM + CJS + d.ts in <1s/package.
- Vitest plays nicely with ESM + unified.
- Changesets supports independent per-package semver, which we need for 8 packages.

**Consequence:** Contributors must use pnpm. CI must run on Node 20+.

---

## ADR-002 — Scope name `@next-ai-ready/*` + meta package `next-ai-ready`
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Publish 8 internal packages under `@next-ai-ready/*`. Additionally ship a meta package `next-ai-ready` that re-exports the common API.

**Rationale:**
- Scope prevents squatting and groups artifacts.
- Independent packages so consumers can use only what they need (`@next-ai-ready/mcp` standalone, etc.).
- Meta package gives "one-line install" DX for typical Next.js users.

**Consequence:** Eight package.json files to maintain; Changesets handles version coordination.

---

## ADR-003 — Content layer: MDX/MD only in MVP, no Contentlayer dependency
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** First milestone runs `unified` directly on MDX/MD files. No Contentlayer / Velite dependency. A `defineContentSource()` adapter interface is reserved for future integration.

**Rationale:**
- Contentlayer v1 archived; v2 not yet stable.
- We must consume MDX AST anyway for extraction — Contentlayer would be a useless middle layer.
- Adapter point keeps the door open for `fumadocs-mdx` / Velite / Notion sources in v0.2+.

**Consequence:** We own the MDX pipeline. Higher initial work but full control of extraction quality.

---

## ADR-004 — Semantic extraction: deterministic only, LLM is a pluggable provider
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** All semantic extraction (summary, FAQ, entities, chunks) is deterministic and heuristic-based in MVP. A `SemanticProvider` interface is defined in `core` but no LLM-backed implementation ships.

**Rationale:**
- **Reproducible builds.** Same input + same config must produce bit-identical output. LLM calls break this.
- **No external API keys** required for `next build`.
- **Cost & latency.** LLM extraction on a 500-page docs site is minutes and dollars.
- Defer LLM-augmented extraction to v0.2+ as opt-in.

**Consequence:** MVP extraction quality ceiling is "good defaults"; users who want richer summaries can plug in a provider later.

---

## ADR-005 — Action discovery: explicit manifest, not file-system scanning
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Users author `actions/index.ts` that exports an `actions` array. We do **not** auto-scan a folder for default-exported `defineAction()` calls.

**Rationale:**
- File-system scanning under App Router has many edge cases (`"use server"` collision, RSC, private folders).
- Explicit imports are tree-shaking friendly.
- Explicit registry gives users a union type of all actions (DX win).
- Easier to debug ("grep for it").

**Consequence:** One extra file for users. Worth it.

---

## ADR-006 — No bundler plugin; build CLI emits JSON artifacts
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Content scanning + compilation runs in a separate CLI (`next-ai-ready build`), **not** as a webpack/turbopack plugin. Outputs land in `.next-ai-ready/*.json`. Runtime handlers read those files (with `outputFileTracingIncludes`).

**Rationale:**
- Turbopack does not accept custom plugins. webpack-only plugins would break Next 15+ dev defaults.
- Decoupling from the bundler makes the pipeline portable (could even run pre-build in CI).
- This is the same pattern Contentlayer, Velite, fumadocs-mdx converged on.

**Consequence:** Users add `next-ai-ready build &&` to their build script. A 5-second cost for a portable, reproducible pipeline.

---

## ADR-007 — Route handlers are user-owned files (codemod generates them)
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** We do not magically inject routes. Users run `npx next-ai-ready init`, which writes thin one-line re-export files into their `app/`. Each file is human-readable and auditable.

**Rationale:**
- Next App Router has no public "inject route" API.
- User-owned files = transparent, debuggable, customisable.
- Each file is one line, so DX cost is minimal.

**Consequence:** Init is part of onboarding. We must keep handler imports stable across versions (semver discipline).

---

## ADR-008 — MCP via `vercel/mcp-handler`, not a custom implementation
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Our `@next-ai-ready/mcp` package is a thin adapter that hands the ActionRegistry to `vercel/mcp-handler`. We do not reimplement the MCP wire protocol.

**Rationale:**
- `mcp-handler` is the official Vercel-maintained adapter; we'd be reinventing badly.
- It already handles Streamable HTTP, SSE, session management.
- Cuts scope of `@next-ai-ready/mcp` to ~200 lines (registry → tools, graph → resources).

**Consequence:** We take a peer dependency on `@modelcontextprotocol/sdk` and `mcp-handler`. Version bumps must be tracked.

---

## ADR-009 — Default endpoint `/api/mcp`, not `/_next/mcp`
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Our production MCP server mounts at `/api/mcp`. The `/_next/*` namespace is reserved by Next.js (Next 16's built-in dev MCP lives at `/_next/mcp`).

**Rationale:** Avoid namespace collision and confusion between dev-time diagnostics (Next-owned) and production business capabilities (us).

**Consequence:** Documentation must explain the distinction up front.

---

## ADR-010 — Default deny for action exposure (`public: true` required)
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** `defineAction()` is **not** HTTP/MCP-exposed unless `public: true` is set. The build CLI fails (or warns loudly) when a public action lacks a `whenToUse` field.

**Rationale:** Exposing arbitrary internal logic to agents is a serious attack surface. Default-deny is the only safe default.

**Consequence:** Users must explicitly opt in. Documented prominently.

---

## ADR-011 — Static-first, handler-fallback artifact serving
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Artifacts that don't depend on request state (`llms.txt`, `llms-full.txt`, `openapi.json`, `tools.json`, `ai-plugin.json`) are emitted to `public/` at build time. Handlers exist as fallback. Per-route artifacts (`*.md`, `*.ai.json`) are served by handlers reading the cached graph.

**Rationale:** Cheaper, cacheable on CDN, predictable.

**Consequence:** `next-ai-ready build` writes to both `public/` and `.next-ai-ready/`. Make sure `public/` writes are gitignore-safe.

---

## ADR-012 — Node runtime by default, no Edge in MVP
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** All handlers declare `export const runtime = "nodejs"`. Edge runtime not supported in MVP.

**Rationale:** `unified`, `remark-mdx`, `zod-to-json-schema` bundle size and API compatibility on Edge are problematic. Not worth the surface area in MVP.

**Consequence:** Vercel users get Lambdas, not Edge functions for AI endpoints. Acceptable for a build-time-static workflow.

---

## ADR-013 — Zod peer dependency: `^3.23 || ^4`
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Support both Zod 3 (latest) and Zod 4. Internal adapter selects native `.toJSONSchema()` on v4, falls back to `zod-to-json-schema` on v3.

**Rationale:** Zod 4 is current but v3 dominates real-world Next.js codebases. Forcing migration would block adoption.

**Consequence:** One adapter file, regression-tested against both versions in CI.

---

## ADR-014 — `Next ≥ 14.2`, App Router only (no Pages Router)
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** Drop Pages Router support entirely. Minimum Next.js version 14.2. Primary target Next 15/16.

**Rationale:** Two routing systems would double the API surface. Pages Router is in maintenance mode upstream.

**Consequence:** Some legacy projects can't adopt. We accept this tradeoff.

---

## ADR-015 — Reproducible JSON artifacts
**Status:** Accepted · **Date:** 2026-05-28

**Decision:** All emitted JSON (`graph.json`, `actions.manifest.json`, `openapi.json`, `tools.json`, `*.ai.json`) is **deterministic**: stable key order, no timestamps in payload (except `generatedAt` in a header field), stable node IDs (hashed inputs).

**Rationale:** Enables `git diff` review, CI caching, drift detection.

**Consequence:** All emitters must sort keys and use a stable JSON serializer. We'll likely add a `serializeStable()` helper in `core`.
