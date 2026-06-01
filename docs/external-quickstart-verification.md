# External quickstart verification

> Records how a user **outside this monorepo** can install `next-ai-ready@alpha` and reach AI endpoints.  
> Last verified: **2026-06-01** (CI + `scripts/external-quickstart-smoke.mjs`).

## 0.1 Definition of Done (target)

A new user should complete within **~10 minutes**:

```text
create-next-app → pnpm add next-ai-ready@alpha → next-ai-ready init → next-ai-ready build → next dev
```

Then access:

- `GET /llms.txt` → 200, plain text
- `GET /openapi.json` → 200, OpenAPI 3.1 JSON
- `next-ai-ready doctor` → **exit 0** (warnings OK)

## Automated verification (CI)

### In-repo integration test (X-01)

`packages/next/test/e2e-pipeline.test.ts` runs in CI:

1. `runInit()` — scaffolds config, handlers, patches `next.config.mjs` + `package.json`
2. `runBuild()` — writes graph, llms.txt, openapi.json, actions manifest
3. Handlers — `llms-txt`, `openapi`, `POST /api/actions/ping`
4. `runDoctor()` — **errors = 0**, score > 0

Init templates import **`next-ai-ready`** only (not `@next-ai-ready/*`) so a single-package install works under pnpm.

### Monorepo-adjacent smoke (E-02)

After `pnpm build`, CI runs:

```bash
node scripts/e2e-smoke.mjs
```

Uses workspace links; checks init → build → doctor --score.

### npm install path smoke

After `pnpm build`:

```bash
pnpm external:smoke
# or: node scripts/external-quickstart-smoke.mjs
```

Packs `next-ai-ready` locally, installs the tarball in a temp dir (simulates registry install), runs init → build → doctor.

## Manual verification (npm registry)

Run in a **clean directory outside the monorepo** (e.g. `/tmp/nair-verify`):

```bash
mkdir -p /tmp/nair-verify && cd /tmp/nair-verify
pnpm create next-app@latest my-app --yes
cd my-app
pnpm add next-ai-ready@alpha zod@^4
pnpm exec next-ai-ready init
pnpm exec next-ai-ready build
pnpm exec next-ai-ready doctor --score
pnpm dev
```

In another terminal:

```bash
curl -sS http://localhost:3000/llms.txt | head
curl -sS http://localhost:3000/openapi.json | head -c 200
```

### Expected doctor output (after build)

- ✓ Config, site fields, graph.json, openapi.json
- ✓ `withAiReady()` in next.config
- ✓ build script includes `next-ai-ready build`
- ⚠ Warnings OK: MCP token unset, missing updatedAt on pages, JSON-LD helpers, etc.
- **Exit code: 0** (no errors)

### Registry status

As of 2026-06-01:

- **npm `@alpha`:** `0.1.0-alpha.5` — single-package install verified (`USE_NPM=1 pnpm external:smoke`)
- **alpha.4:** deprecated for pnpm users (scoped import bug); use ≥ alpha.5

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find package '@next-ai-ready/core'` | Upgrade to `@alpha` ≥ alpha.5; only install `next-ai-ready`, not scoped packages |
| `pnpm publish` 403 | Granular Token + Bypass 2FA; see [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Per-route `.md` 404 | `withAiReady()` + route stubs from `init` |
| Stale graph in dev | Re-run `next-ai-ready build` (no `dev` watch yet — R-07) |
| MCP 401 in production | `NEXT_AI_READY_MCP_TOKEN` + `Authorization: Bearer <token>` |

## Sign-off checklist

- [x] `external-quickstart-smoke.mjs` (local link) — 2026-06-01
- [x] `USE_NPM=1` npm `@alpha` install path — 2026-06-01 (doctor exit 0, score 88)
- [x] `doctor` exit 0 on fresh init project — 2026-06-01
- [ ] Manual `/tmp` + `create-next-app` + dev + curl (optional full UX)
