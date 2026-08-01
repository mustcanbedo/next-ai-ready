# 0.1 GA readiness

**GA** for this project means the first **generally recommendable** release: **`0.1.0`** (or final **`0.1.0-alpha.N`** before dropping the alpha tag), where a Next.js team can install, build, deploy, and get predictable AI artifacts without reading the whole monorepo.

**Current development branch version:** `0.1.0-alpha.14`. **npm `@alpha`:** `0.1.0-alpha.14` published. Audit v3, focused runtime exports, TypeScript Action loading, and MCP page discovery are now in the public package; see [improvement-plan.zh-CN.md](./improvement-plan.zh-CN.md) for the remaining production MCP and registry-matrix validation before the **`0.1.0`** GA tag.

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
| 1b | **Publish `0.1.0-alpha.14`** complete runtime chain to npm `@alpha` | Maintainer | ✅ Published 2026-08-02; clean registry install, CLI flow, and Next.js 15 production build passed |
| 2 | **Vercel env** `NEXT_AI_READY_MCP_TOKEN` | Maintainer | ✅ Production Sensitive value saved 2026-08-01; basePath fix is merged and released in alpha.14, authenticated production initialize still needs revalidation |
| 3 | **Commit regenerated** `examples/docs-site/public/*` after the release build | Maintainer | Run build + `pnpm check:artifacts` in docs-site |
| 4 | **Optional:** tag `v0.1.0` and README “stable 0.1” | Maintainer | When ready to drop `@alpha` install path |
| 5 | **Optional:** 10 min UX path outside monorepo | Contributor | [CONTRIBUTING.md](../CONTRIBUTING.md) |

Automated gate: `pnpm verify:release` (includes docs-site smoke).

---

## 0.1 Definition of Done (GA)

- [x] `pnpm add next-ai-ready@alpha` → `init` → `build` → `doctor` (0 errors)
- [x] `examples/docs-site` full dogfood
- [x] CI: build, test, typecheck, lint, e2e-smoke, docs-site-smoke
- [x] Known limitations in README (Zod v4, Node-only, no static export, App Router)
- [x] [quickstart-10min](./quickstart-10min.md) for new adopters
- [x] npm **`@alpha` = alpha.14** published (2026-08-02)
- [x] Production MCP token on Vercel (ops; saved and deployed 2026-08-01)
- [ ] Authenticated production MCP initialize succeeds (alpha.14/basePath fix published; production revalidation pending)
- [ ] README status line updated to “0.1” when tag ships (pending GA tag)

---

## Document map

| Question | Doc |
|----------|-----|
| How complete is the project? | [completion-audit.md](./completion-audit.md) |
| Every tracked task? | [backlog.md](./backlog.md) |
| What to do after GA? | [post-ga.md](./post-ga.md) |
| All docs listed? | [README.md](./README.md) (this folder) |
