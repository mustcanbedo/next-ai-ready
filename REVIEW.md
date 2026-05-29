# next-ai-ready — Project Review

> Reviewer role: project author  
> Date: 2025-07-15  
> Scope: full codebase audit — architecture, code quality, tests, docs  
> Test suite status: **61 / 61 pass** (all packages green individually)

---

## Executive Summary

The project delivers a coherent two-plane (Knowledge + Capability) AEO/Agent-API layer for Next.js. The architecture is sound, the code is clean and well-documented, and the test suite covers the critical paths. There are **no showstoppers**, but several issues need attention before a public alpha release.

### Severity key

| Emoji | Meaning |
|-------|---------|
| 🔴 | Must fix before alpha |
| 🟡 | Should fix / tech debt |
| 🟢 | Nice-to-have / polish |

---

## 1. Monorepo Structure & Build Config

### 1.1 What's good

- **Clean 9-package layout** matches the architecture doc exactly.
- **Turbo pipeline** with `^build` dependency ordering is correct.
- **pnpm workspace** with `packages/*` + `examples/*` is standard.
- **tsconfig.base.json** uses strict settings (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, etc.) — excellent.
- **tsup** for all packages, ESM-only, `node20` target — clean and consistent.
- All packages use `"type": "module"`, consistent `exports` map, and `files: ["dist"]`.
- Changeset setup is present (`.changeset/` directory exists).

### 1.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 1.1 | 🔴 | **Cyclic dependency: `mdx` ↔ `semantic`.** `mdx` depends on `semantic` (runtime dep), `semantic` depends on `mdx` (devDep). Turbo detects this and fails `pnpm test` at the monorepo root. Individual `pnpm --filter` test commands pass, but CI running `turbo run test` will break. Fix: move `@next-ai-ready/mdx` from `semantic`'s `devDependencies` to a test-only alias, or restructure so the `semantic` test imports fixtures directly instead of going through `@next-ai-ready/mdx`. |
| 1.2 | 🟡 | **`meta` package is hollow.** Only re-exports `@next-ai-ready/core`; the commented-out `defineAction` and `withAiReady` re-exports are not active. Either uncomment them or remove `meta` until it's ready. The CLI shim (`meta/src/cli.ts`) works but the package has no `test` script and no tests. |
| 1.3 | 🟡 | **Dual `bin` entry.** Both `meta` (`next-ai-ready` on npm) and `@next-ai-ready/next` declare a `next-ai-ready` binary. When both are installed, npm/pnpm picks one non-deterministically. Decide: the user installs `next-ai-ready` (meta) OR `@next-ai-ready/next`, not both. Document this. |
| 1.4 | 🟡 | **No `lint` scripts.** `turbo.json` declares a `lint` task, root `package.json` has `"lint": "turbo run lint"`, but no package defines a `lint` script. Add ESLint configs or remove the dead task. |
| 1.5 | 🟢 | **`docs/` and `examples/` are empty.** The workspace includes `examples/*` but there are no example apps. Not blocking, but the README references `docs/goals.md`, `docs/architecture.md`, etc., which do exist. |

---

## 2. Core Types & Utilities (`@next-ai-ready/core`)

### 2.1 What's good

- **`types.ts`** is an excellent type contract — 321 lines of thoroughly documented interfaces. The `SchemaLike` structural type avoids coupling core to Zod.
- **`stableId()`** uses SHA-256 with null separators — correct and collision-resistant.
- **`serializeStable()`** with recursive key sorting — guarantees deterministic JSON.
- **`scanContent()`** with `fileToRoute()` correctly handles App Router conventions (`(group)`, `_private`, `page.mdx`).
- **`identifyAiBot()`** — clean, ordered for fast first-match.
- **`buildRobotsTxt()`** — deterministic, explicit per-bot blocks.
- **`defineConfig()` / `withDefaults()`** — minimal, correct.

### 2.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 2.1 | 🟡 | **`core` has runtime deps (`fast-glob`, `gray-matter`) but is consumed by packages that may not need scanning.** Consider splitting scanner into a separate export (`@next-ai-ready/core/scanner`) so browser-side code that only needs types doesn't pull in Node-only deps. Low priority since the package is server-only. |
| 2.2 | 🟢 | **`_relative` re-export** in `scanner.ts` (line 82) is unused and unexplained. Remove it. |
| 2.3 | 🟢 | **`AiReadyConfig.actions` type uses `any`** with an ESLint disable comment and a good explanation. Acceptable, but consider a branded `AnyActionDef` type alias to limit the blast radius. |

---

## 3. MDX Pipeline (`@next-ai-ready/mdx`)

### 3.1 What's good

- **Unified-based pipeline**: `remark-parse` → `remark-gfm` → `remark-mdx` → `remark-frontmatter` — standard and maintainable.
- **`sectionize()`** with `github-slugger` for heading-based tree decomposition.
- **`chunkSections()`** for token-aware splitting with configurable `maxTokens` / `overlap`.
- **FAQ extraction** from both frontmatter and heading heuristics (`?` endings, `Q:` prefixes).
- **JSX stripping / mapping** — `renderMarkdown()` with pluggable `ComponentMap`.
- **`compile()`** is deterministic: content-based IDs, no timestamps in nodes.

### 3.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 3.1 | 🟡 | **`compile()` is synchronous** but the build CLI `await`s it (line 80 of `build.ts`: `await compile(...)`). This works but is misleading — `compile` returns `CompileOutput`, not a Promise. The `await` is a no-op but implies async. Cosmetic. |
| 3.2 | 🟢 | **No test for chunk overlap.** The chunking logic has `overlap` config but tests don't exercise it. Add a test with overlapping sections. |

---

## 4. Semantic Package (`@next-ai-ready/semantic`)

### 4.1 What's good

- **`buildGraph()`** — clean, sorts routes lexicographically, flat node store.
- **`getPageNodes()`** — correct tree traversal.
- **JSON-LD** — `pageJsonLd()` emits `WebPage`, `Article`, `FAQPage`, `BreadcrumbList` correctly. `siteJsonLd()` emits `WebSite` + `Organization`. `stripUndefined()` is a nice touch.
- **5 tests** covering graph assembly, JSON-LD variants, and edge cases.

### 4.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 4.1 | 🟡 | **`getPageNodes()` only traverses one level of children** (line 45: `root.children ?? []`). If a section has sub-children, they won't be included. Currently safe because the graph is flat (only page → children), but the comment says "descendants" which implies recursive. Add a recursive helper or update the doc. |
| 4.2 | 🟢 | **`absoluteUrl()` duplicated** in `jsonld.ts` and `compile.ts`. Extract to core. |

---

## 5. LLMs Package (`@next-ai-ready/llms`)

### 5.1 What's good

- **`renderLlmsTxt()`** — correct llmstxt.org format, curated sections with priority/limit/exclude.
- **`renderLlmsFullTxt()`** — stable BEGIN/END markers per route.
- **`renderPageMarkdown()`** — YAML-style metadata header + body, clean format.
- **`renderPageAiJson()`** — page node + all children in a single JSON response.
- **`globToRegex()`** — minimal but adequate for route patterns (`*`, `**`).

### 5.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 5.1 | 🟡 | **`globToRegex()` doesn't escape `/` after `**`.** Pattern `/docs/**` produces `^/docs/.*$` which works, but `/docs/**/advanced` produces `^/docs/.*/advanced$` which matches `/docs/foo/bar/advanced`. This is correct by glob semantics but not documented. |
| 5.2 | 🟢 | **`byMostRecent` comparator** falls back to route `localeCompare` when dates are equal — good. But the tie-breaker runs on every comparison, consider caching. Very minor. |

---

## 6. Actions Package (`@next-ai-ready/actions`)

### 6.1 What's good

- **Clean separation**: `defineAction()` (authoring) → `registry.ts` (singleton) → `invoke.ts` (execution) → `manifest.ts` (serialization) → `schema.ts` (Zod → JSON Schema).
- **Security model**: `public: false` by default, `auth` gate, input validation via `safeParse`, non-public actions hidden as 404 (not 403) — all correct per ADR-010.
- **`invokeAction()` returns a discriminated union** `InvokeResult` — clean API.
- **`buildActionContext()`** with manual cookie parsing — avoids Next.js runtime dependency.
- **11 tests** covering all security paths, manifest generation, and edge cases.

### 6.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 6.1 | 🟡 | **`schemaToJsonSchema()` uses Zod v4 `z.toJSONSchema()`.** The dep is `"zod": "^4.4.3"` which is bleeding-edge. Zod v4 is still in preview; many users are on v3. Consider documenting the Zod version requirement prominently, or providing a v3 adapter. |
| 6.2 | 🟡 | **`isZodSchema()` checks for `_def` property.** This is a Zod internal. If Zod v4 renames it, the check silently fails and `schemaToJsonSchema` throws. Add a more robust detection (e.g., check `_zod` or `z.ZodType.prototype`). |
| 6.3 | 🟢 | **`extractZodIssues()` checks for `.issues`** — correct, but Zod v4 may change the error shape. Consider using `ZodError` type guard if available. |

---

## 7. OpenAPI Package (`@next-ai-ready/openapi`)

### 7.1 What's good

- **OpenAPI 3.1** — correct choice for JSON Schema 2020-12 compatibility.
- **`buildOpenApi()`** — `x-ai-when-to-use` / `x-ai-when-not-to-use` extensions, examples via `x-ai-examples`. Good AI-agent DX.
- **`buildToolsJson()`** — OpenAI function-calling format, correctly folds guidance into description.
- **`buildAiPlugin()`** — ChatGPT plugin format with sensible defaults.
- **7 tests** covering all three emitters.

### 7.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 7.1 | 🟢 | **`buildToolsJson()` accepts `_site` but doesn't use it.** Either use it (e.g., prepend site name to descriptions) or remove the parameter. |
| 7.2 | 🟢 | **`buildAiPlugin()` has `contact_email: ""`** as default. Some validators reject empty strings; consider omitting the field when not provided. |

---

## 8. MCP Package (`@next-ai-ready/mcp`)

### 8.1 What's good

- **Transport-agnostic**: `McpServerLike` structural interface avoids hard SDK dependency.
- **`toMcpToolDefinitions()`** reuses `invokeAction()` — zero duplicated security logic.
- **`toMcpResourceDefinitions()`** exposes pages as `airead://page/...` URIs.
- **`registerAiReady()`** — clean registration with tool/resource counts.
- **6 tests** covering tool exposure, execution, resources, server registration, and filtering.

### 8.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 8.1 | 🟡 | **`registerAiReady()` passes `inputShape` to `server.tool()` (line 45).** But `McpServerLike.tool()` signature takes `paramsSchema: Record<string, unknown>` as 3rd arg. The MCP SDK actually expects the raw Zod shape here, not JSON Schema. This is correct for the current SDK version, but the naming (`paramsSchema` vs `inputShape`) is confusing. Add a comment. |
| 8.2 | 🟡 | **`toMcpToolDefinitions().execute()` creates a synthetic `Request` for stdio transport** (line 47: `new Request("http://mcp.local/")`). Actions with `auth` gates will always deny this. Document this limitation: auth-gated actions are inaccessible over stdio unless the user provides a custom auth bypass. |
| 8.3 | 🟢 | **`readMcpResource()` duplicates logic** from `toMcpResourceDefinitions()`. Consider sharing the URI → route mapping. |

---

## 9. Next Package (`@next-ai-ready/next`)

### 9.1 Handlers

**What's good:**
- All handlers follow a consistent pattern: `import "server-only"` → load data → render → return `Response`.
- `emitAiRequest()` / `emitInvoke()` hooks integrated without cluttering the response path.
- `action.ts` POST handler: correct parameter extraction via `params.name`, bot identification from UA, latency tracking.
- 404 handling for missing routes/actions.

| # | Sev | Finding |
|---|-----|---------|
| 9.1 | 🟡 | **`openapi.ts` and `tools.ts` handlers don't emit `emitAiRequest()`** unlike the content handlers. These are AI artifact endpoints too and should be instrumented. |
| 9.2 | 🟡 | **`openapi.ts` handler signature: `GET()` has no `req` parameter.** Cannot track UA for observability. Same for `tools.ts`. |
| 9.3 | 🟡 | **`action.ts` line 11: `params: Promise<{ name: string }>`** — using `Promise<>` for route params is a Next.js 15 pattern. This won't work on Next 14 where params is a plain object. Document the minimum Next version requirement or add a compat layer. |

### 9.2 CLI

**What's good:**
- **`init`** — scaffolds config + 8 route stubs + `actions/index.ts`. Non-destructive (skips existing files, `--force` to overwrite).
- **`build`** — full pipeline: scan → compile → graph → llms.txt → robots.txt → OpenAPI → tools.json. Deterministic.
- **`doctor`** — structured diagnostics, CI exit codes. Validates config, actions, build artifacts, route stubs.
- **`mcp`** — stdio server with graceful SDK-missing errors.
- **`load-config.ts`** — clean ESM-only config loader, `.mjs` / `.js` support.

| # | Sev | Finding |
|---|-----|---------|
| 9.4 | 🟡 | **No `.ts` config file support.** The comment says "tracked for Phase 5" but Phase 5 is marked done. Either add `jiti`/`tsx` support or update the comment. |
| 9.5 | 🟢 | **`importSdkStdio()` in `mcp-stdio.ts` (line 77-79) has no try/catch** unlike `importSdkServer()`. If the SDK is installed but `stdio.js` subpath is missing, the error won't be actionable. |

### 9.3 Runtime

**What's good:**
- **`graph-loader.ts`** and **`manifest-loader.ts`** — per-process caching, correct invalidation API.
- **`observability.ts`** — hooks never throw, `safePath()` for URL parsing safety.
- **`with-ai-ready.ts`** — minimal Next.js config wrapper, correct rewrite rules and `outputFileTracingIncludes`.

| # | Sev | Finding |
|---|-----|---------|
| 9.6 | 🟡 | **`withAiReady()` rewrites assume flat rewrite format.** Next.js `rewrites()` can return `{ beforeFiles, afterFiles, fallback }`. The current code treats `prior()` result as a flat array, which will break if the user returns the object form. |
| 9.7 | 🟢 | **Cache invalidation is manual** (`invalidateGraphCache()`, `invalidateManifestCache()`). In dev mode, there's no file-watcher. Users must rebuild manually or restart the dev server. Document this. |

### 9.4 Package config

| # | Sev | Finding |
|---|-----|---------|
| 9.8 | 🟡 | **`next` is marked as optional peer dep** (`peerDependenciesMeta.next.optional: true`). This means the package can be installed without Next.js, which makes sense for CLI-only use, but the handler modules will crash at import time (`import "server-only"` fails). Document which exports require Next.js. |

---

## 10. Test Coverage & Quality

### 10.1 Summary

| Package | Test file(s) | Tests | Coverage |
|---------|-------------|-------|----------|
| `core` | `robots.test.ts` | 5 | robots.txt builder only |
| `mdx` | `compile.test.ts` | 7 | compile pipeline end-to-end |
| `semantic` | `graph.test.ts` | 5 | graph + JSON-LD |
| `llms` | `llms.test.ts` | 7 | all 4 renderers |
| `actions` | `actions.test.ts` | 11 | define, registry, manifest, invoke |
| `openapi` | `openapi.test.ts` | 7 | openapi, tools, ai-plugin |
| `mcp` | `mcp.test.ts` | 6 | tools, resources, server |
| `next` | `build.test.ts`, `actions.test.ts`, `init.test.ts`, `phase5.test.ts` | 13 | build, handlers, init, doctor, observability |
| **Total** | **11 files** | **61** | |

### 10.2 Quality assessment

**Strengths:**
- Tests use real fixtures (`content/docs/install.mdx`, `content/index.mdx`) and test the full pipeline end-to-end.
- Determinism tests (same input → same output) are present for both compile and build.
- Security tests: non-public action hidden, auth gate, invalid input validation.
- Test isolation: `beforeEach(clearRegistry())`, temp directories with cleanup.
- Edge cases tested: missing routes → 404, missing config → error diagnostic.

### 10.3 Gaps

| # | Sev | Finding |
|---|-----|---------|
| 10.1 | 🔴 | **`core` is under-tested.** No tests for `scanner.ts` (`fileToRoute`, `scanContent`), `id.ts` (`stableId`), `json.ts` (`serializeStable`), `config.ts` (`defineConfig`, `withDefaults`), `bots.ts` (`identifyAiBot`). These are foundational utilities. |
| 10.2 | 🟡 | **No tests for `withAiReady()`** config wrapper. The rewrite and file-tracing logic is untested. |
| 10.3 | 🟡 | **No tests for `load-config.ts`.** Config loading from disk is untested. |
| 10.4 | 🟡 | **`mcp-stdio.ts` is untested.** The stdio server path is only tested indirectly through `mcp.test.ts` unit tests. |
| 10.5 | 🟡 | **No integration test** that runs the full `init → build → serve` flow in a single test. |
| 10.6 | 🟢 | **No snapshot tests** for generated artifacts (openapi.json, tools.json, llms.txt). Snapshots would catch unintended format changes. |

---

## 11. Documentation & README

### 11.1 What's good

- **README** is clear, well-structured, with a good architecture diagram and quick-start.
- **`docs/architecture.md`** is thorough (342 lines) with the two-plane ASCII diagram.
- Status section is honest about pre-alpha state.
- ADR references throughout the code are consistent.

### 11.2 Issues

| # | Sev | Finding |
|---|-----|---------|
| 11.1 | 🟡 | **Test count in README says "61 tests across 9 packages"** but `meta` has no tests. It's 61 tests across 8 packages. |
| 11.2 | 🟡 | **`docs/` exists but `docs/goals.md`, `docs/research.md`, `docs/decisions.md`, `docs/roadmap.md`** are referenced in README but I cannot verify they're non-empty (the `docs/` dir shows 0 items in listing). Either they're empty or gitignored. |
| 11.3 | 🟡 | **No CONTRIBUTING.md** or development setup guide. |
| 11.4 | 🟢 | **No JSDoc on package public APIs.** Handler modules export bare `GET`/`POST` functions without JSDoc. |

---

## 12. Top Priorities (Ordered)

### Must fix before alpha (🔴)

1. **Fix cyclic dependency `mdx ↔ semantic`** — breaks `turbo run test`. Move the `mdx` devDep out of `semantic` (use direct fixture imports in semantic tests instead of importing `compile` from `@next-ai-ready/mdx`).
2. **Add core utility tests** — `stableId`, `serializeStable`, `fileToRoute`, `identifyAiBot` are load-bearing and untested.

### Should fix (🟡)

3. Add `emitAiRequest()` to `openapi.ts` and `tools.ts` handlers.
4. Handle Next.js 14 params compatibility (plain object vs Promise).
5. Fix `withAiReady()` rewrites to handle the `{ beforeFiles, afterFiles, fallback }` form.
6. Document Zod v4 requirement prominently.
7. Enable `meta` re-exports or defer the package.
8. Resolve dual `bin` conflict between `meta` and `next`.
9. Add tests for `withAiReady()`, `load-config.ts`.
10. Add lint config or remove dead task.
11. Update `.ts` config support comment (Phase 5 done but feature missing).

### Nice to have (🟢)

12. Extract duplicated `absoluteUrl()` helper to core.
13. Remove unused `_relative` export from `scanner.ts`.
14. Add snapshot tests for generated artifacts.
15. Add CONTRIBUTING.md.

---

## 13. Architecture Assessment

**Overall: Strong.** The two-plane architecture (Knowledge + Capability) is well-realized. Key design decisions:

- **Build-time → JSON artifacts → runtime handlers** avoids bundler coupling.
- **`server-only` at handler entry, not loader** — correct for CLI compatibility.
- **Optional peer deps for MCP** — right call; no forced SDK install.
- **Deterministic output** across the board — essential for CI/CD.
- **Security by default** (`public: false`, auth gates, input validation).
- **Observability without breakage** (hooks swallow errors).

The code is consistently clean, well-commented, and follows established patterns. For a pre-alpha project, this is unusually mature.

---

*End of review.*
