# External quickstart verification

> Records how a user **outside this monorepo** can install the published `next-ai-ready` package and reach AI endpoints.
> Last verified: **2026-08-02** (`scripts/external-quickstart-smoke.mjs`).

## 0.1 Definition of Done (target)

A new user should complete within **~10 minutes**:

```text
create-next-app → pnpm add next-ai-ready → next-ai-ready init → next-ai-ready build → next dev
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

### Clean tarball install matrix

After `pnpm build`:

```bash
pnpm external:smoke
# npm + Next.js 14
PACKAGE_MANAGER=npm NEXT_VERSION=14 pnpm external:smoke
# pnpm + Next.js 16
PACKAGE_MANAGER=pnpm NEXT_VERSION=16 pnpm external:smoke
# repository-pinned pnpm 9 via Corepack
PACKAGE_MANAGER=pnpm NEXT_VERSION=15 PNPM_VIA_COREPACK=1 node scripts/external-quickstart-smoke.mjs
```

The smoke packs all publishable runtime packages from the current checkout. The
consumer manifest directly depends only on the `next-ai-ready` meta tarball;
npm/pnpm overrides resolve its scoped transitive dependencies to the other local
tarballs. A deliberately unreachable scoped registry makes any accidental fallback
to an older published package fail immediately. It then runs:

1. `next-ai-ready init`
2. `next-ai-ready build`
3. `next-ai-ready doctor --score`
4. a real `next build`

GitHub Actions runs six combinations: npm and pnpm across Next.js 14, 15, and 16.
This validates the current branch rather than silently fetching an older scoped
package from the npm registry. Tarball manifests and lockfiles are also checked so
`workspace:` ranges or registry-backed internal packages cannot slip through.
The fixture writes overrides to both legacy package metadata and
`pnpm-workspace.yaml`, so it covers the repository-pinned pnpm 9 as well as pnpm
11's root-settings model. pnpm 11 only permits the reviewed `sharp` install script
inside the disposable consumer project; it does not enable arbitrary dependency builds.

Set `PACKAGE_SOURCE=registry REGISTRY_TAG=latest` to test the default published package.
The smoke resolves the dist-tag through npm and requires the installed package to
match that exact version, so stale package-manager metadata cannot produce a false pass.
The legacy `USE_NPM=1` switch remains an alias for registry source selection.

## Manual verification (npm registry)

Run in a **clean directory outside the monorepo** (e.g. `/tmp/nair-verify`):

```bash
mkdir -p /tmp/nair-verify && cd /tmp/nair-verify
pnpm create next-app@latest my-app --yes
cd my-app
pnpm add next-ai-ready zod@^4
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

As of 2026-08-02:

- **npm `latest` and `alpha`:** `0.1.0-alpha.16` — registry single-package installation, CLI workflow, and production builds verified with pnpm + Next.js 16.2.12 and npm + Next.js 15.5.22. The preceding alpha.15 passed the full npm/pnpm × Next.js 14/15/16 matrix.
- **alpha.13:** superseded after registry smoke exposed an incomplete published Semantic/Core export chain; use alpha.14 or newer.
- **alpha.4:** deprecated for pnpm users (scoped import bug); use ≥ alpha.5

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find package '@next-ai-ready/core'` | Upgrade to `@alpha` ≥ alpha.5; only install `next-ai-ready`, not scoped packages |
| `Package subpath './jsonld' is not defined by exports` | Upgrade to `next-ai-ready@alpha` ≥ alpha.14; alpha.13 referenced an older Semantic manifest |
| `pnpm publish` 403 | Granular Token + Bypass 2FA; see [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Per-route `.md` 404 | `withAiReady()` + route stubs from `init` |
| Stale graph in dev | Re-run `next-ai-ready build` (no `dev` watch yet — R-07) |
| MCP 401 in production | `NEXT_AI_READY_MCP_TOKEN` + `Authorization: Bearer <token>` |

## Sign-off checklist

- [x] Local current-branch tarball install — 2026-08-01
- [x] npm/pnpm × Next.js 14/15/16 public-registry matrix — 2026-08-02
- [x] Every combination installed `next-ai-ready@0.1.0-alpha.15`
- [x] `init`, artifact build, `doctor`, and production build passed in every combination
- [x] npm `latest` alpha.16 reverified with pnpm/Next.js 16 and npm/Next.js 15 — 2026-08-02
- [x] Full npm/pnpm × Next.js 14/15/16 tarball matrix on `main` CI
- [ ] Manual `/tmp` + `create-next-app` + dev + curl (optional full UX)
