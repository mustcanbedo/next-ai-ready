# Documentation index

Central map for **next-ai-ready** repository docs (not the live docs site — that is [next-ai-ready.vercel.app](https://next-ai-ready.vercel.app/en)).

## Start here

| Audience | Read first |
|----------|------------|
| New adopter | [quickstart-10min.md](./quickstart-10min.md) · [中文](./quickstart-10min.zh-CN.md) |
| Maintainer / release | [ga-readiness.md](./ga-readiness.md) → [completion-audit.md](./completion-audit.md) |
| Current improvement status | [improvement-plan.zh-CN.md](./improvement-plan.zh-CN.md) |
| Long-term backlog | [backlog.md](./backlog.md) |
| After 0.1 GA | [post-ga.md](./post-ga.md) |

## Core design

| Doc | Purpose |
|-----|---------|
| [goals.md](./goals.md) | North star — 24 AEO + Agent tactics |
| [architecture.md](./architecture.md) | Two planes, build vs runtime, handlers |
| [decisions.md](./decisions.md) | ADR index |
| [research.md](./research.md) | Competitive landscape |
| [roadmap.md](./roadmap.md) | Phased delivery (Phase 0–6) |
| [improvement-plan.zh-CN.md](./improvement-plan.zh-CN.md) | Current priorities, acceptance criteria, and open product decisions |
| [phase6-design.md](./phase6-design.md) | Post-MVP foundation design |

## Release & quality

| Doc | Purpose |
|-----|---------|
| [ga-readiness.md](./ga-readiness.md) | **0.1 GA** checklist — done vs remaining |
| [release-alpha.md](./release-alpha.md) | Maintainer runbook for the guarded npm alpha workflow |
| [public-api-stability.zh-CN.md](./public-api-stability.zh-CN.md) | `0.1` public API baseline, SemVer, and deprecation policy |
| [release-rollback.zh-CN.md](./release-rollback.zh-CN.md) | npm, Git, and Vercel incident rollback runbook |
| [completion-audit.md](./completion-audit.md) | Completion %, P0–P2 history, 0.1 DoD |
| [backlog.md](./backlog.md) | Full tracked items (single source of truth) |
| [post-ga.md](./post-ga.md) | **After GA** — product/DX optimizations |
| [pre-docs-site-checklist.md](./pre-docs-site-checklist.md) | Docs-site dogfood checklist |
| [external-quickstart-verification.md](./external-quickstart-verification.md) | External install verification notes |

## Examples & recipes

| Path | Purpose |
|------|---------|
| [../examples/docs-site/README.md](../examples/docs-site/README.md) | Dogfood docs + dual-track + artifact policy |
| [../examples/recipes/upstash-ratelimit](../examples/recipes/upstash-ratelimit/) | Rate-limit actions |
| [../examples/recipes/action-auth](../examples/recipes/action-auth/) | Per-action auth for `/api/actions` |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Dev setup, verify:release, publish |

## Historical

| Doc | Note |
|-----|------|
| [../REVIEW.md](../REVIEW.md) | **2025-07 snapshot** — superseded by completion-audit |
| [claude-code-prompt.md](./claude-code-prompt.md) | Internal agent prompt archive |

## Maintenance rules

1. **Current priority and status** → update `improvement-plan.zh-CN.md`; code on a branch is not `completed`.
2. **Shipped work** → mark `[x]` in `backlog.md` with date.
3. **GA scope** → update `ga-readiness.md` and `completion-audit.md` §1 / §9 only (not full rewrites).
4. **New ideas after GA** → record an open decision before adding them to `post-ga.md`.
5. **User-facing install** → keep `README.md` + quickstart in sync with the published npm version.
