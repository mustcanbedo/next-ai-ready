# 0.1 GA readiness

**GA** for this project means the first **generally recommendable** release: **`0.1.0`** (or final **`0.1.0-alpha.N`** before dropping the alpha tag), where a Next.js team can install, build, deploy, and get predictable AI artifacts without reading the whole monorepo.

**Current repository candidate:** `0.1.0-alpha.19`. Public npm availability is determined by registry dist-tags, not by the version committed to `main`. Alpha.19 carries the alpha.18 deterministic `llms.txt` freshness change and closes the public MCP-to-LLMS dependency graph. The previously published alpha.17 includes Audit v3, focused runtime exports, TypeScript `next.config.ts` compatibility, locale-aware MCP page discovery, and Nextra/Fumadocs content discovery. See [improvement-plan.zh-CN.md](./improvement-plan.zh-CN.md) for final **`0.1.0`** GA sign-off.

---

## What “GA” is not

- Not `1.0.0` API freeze forever
- Not hosted SaaS / dashboard
- Not CMS, Pages Router, or Edge handlers for the full Knowledge plane

See [post-ga.md](./post-ga.md) for improvements **after** GA.

---

## Done (framework + docs)

| Area | Status |
|------|--------|
| Knowledge + Capability planes | ✅ build + handlers + tests |
| CLI `init` / `build` / `doctor` / `mcp` | ✅ |
| CLI `audit <url>` deployed AEO/agent-readability verification | ✅ alpha.11 code |
| Doctor `--score`, `actionItems`, `app/robots.ts` + `emit.robots: false` | ✅ alpha.10 code |
| `llms-full.txt` includes page FAQ | ✅ alpha.10 code |
| Docs-site dogfood + `docs-site-smoke` CI | ✅ |
| Docs-site authenticated MCP route smoke | ✅ 401 gate + initialize + three page tools |
| 10-minute quickstart (en/zh) | ✅ |
| README version / i18n / test count | ✅ |
| Action auth recipe | ✅ `examples/recipes/action-auth` |
| Artifact drift check script | ✅ `examples/docs-site/scripts/check-artifacts-drift.mjs` |

---

## Remaining before GA (maintainer actions)

| # | Task | Owner | Notes |
|---|------|-------|-------|
| 1 | **Publish `0.1.0-alpha.11`** to npm `@alpha` | Maintainer | ✅ Published 2026-07-26; deployed audit + agent readability routes included |
| 1a | **Publish `0.1.0-alpha.12`** baseline to npm `@alpha` | Maintainer | ✅ Published 2026-08-01; registry install smoke passed |
| 1b | **Publish `0.1.0-alpha.14`** complete runtime chain to npm `@alpha` | Maintainer | ✅ Published 2026-08-02; npm/pnpm × Next.js 14/15/16 registry matrix passed |
| 1c | **Publish `0.1.0-alpha.15`** with `next.config.ts` compatibility fixes | Maintainer | ✅ Published 2026-08-02; npm/pnpm × Next.js 14/15/16 registry matrix passed |
| 1d | **Publish `0.1.0-alpha.16`** with npm discovery metadata | Maintainer | ✅ Published 2026-08-02; `latest` and `alpha` promoted; public-registry pnpm/Next.js 16 and npm/Next.js 15 smoke passed |
| 1e | **Publish `0.1.0-alpha.17`** with Nextra/Fumadocs discovery and locale search | Maintainer | ✅ Published 2026-08-02 by Release Alpha #5; `latest` and `alpha` promoted; all public npm manifests verified; public-registry pnpm/Next.js 16 smoke passed |
| 1f | **Publish the deterministic freshness release** with a closed dependency graph | Maintainer | 🚧 Alpha.19 candidate prepared after Release Alpha #6 safely rejected the incomplete alpha.18 MCP manifest before publication |
| 2 | **Vercel env** `NEXT_AI_READY_MCP_TOKEN` | Maintainer | ✅ Rotated as a Production Sensitive value and redeployed 2026-08-02; authenticated initialize and all three page tools passed |
| 2a | **Restore GitHub Actions** `NPM_TOKEN` | Maintainer | ✅ Repository secret restored; Release Alpha #4 authenticated, passed the release gate, published alpha.16, and promoted the user-facing packages to `latest` |
| 3 | **Commit regenerated** `examples/docs-site/public/*` after the release build | Maintainer | ✅ alpha.17 content regenerated; artifact smoke, `doctor` 100/100, routes, and public-registry Next.js 16 build passed 2026-08-02 |
| 4 | **Tag `v0.1.0` and update README to “stable 0.1”** | Maintainer | After the 3-project external-adoption gate passes |
| 5 | **Optional:** 10 min UX path outside monorepo | Contributor | [CONTRIBUTING.md](../CONTRIBUTING.md) |

Automated gate: `pnpm verify:release` (includes docs-site smoke).

---

## 0.1 Definition of Done (GA)

- [x] Current `create-next-app` → `pnpm add next-ai-ready` → `init` → `build` → `doctor` → `next build`
- [x] `examples/docs-site` full dogfood
- [x] CI: build, test, typecheck, lint, e2e-smoke, docs-site-smoke
- [x] Known limitations in README (Zod v4, Node-only, no static export, App Router)
- [x] [quickstart-10min](./quickstart-10min.md) for new adopters
- [x] Repository candidate **alpha.19** prepared; Release Alpha verifies publication and npm tag promotion
- [x] Production MCP token on Vercel (rotated, saved, and redeployed 2026-08-02)
- [x] Authenticated production MCP initialize and `list_pages` / `search_pages` / `get_page` succeed
- [ ] At least 3 repository-external Next.js projects complete install, build, deploy, and feedback (current: 0/3 verified)
- [ ] README status line updated to “0.1” when tag ships (pending GA tag)

---

## Document map

| Question | Doc |
|----------|-----|
| How complete is the project? | [completion-audit.md](./completion-audit.md) |
| Every tracked task? | [backlog.md](./backlog.md) |
| What to do after GA? | [post-ga.md](./post-ga.md) |
| All docs listed? | [README.md](./README.md) (this folder) |
