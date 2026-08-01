# Contributing to next-ai-ready

Thanks for helping improve next-ai-ready. This monorepo ships nine npm packages under the `@next-ai-ready/*` scope plus the meta package `next-ai-ready`.

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** 9.x (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)

## Development

```bash
git clone <repo-url>
cd next-ai-ready
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

### Useful commands

| Command | Purpose |
|---------|---------|
| `pnpm build` | Build all packages (turbo) |
| `pnpm test` | Run vitest in all packages |
| `pnpm typecheck` | TypeScript check |
| `node scripts/e2e-smoke.mjs` | External-style init → build smoke (after `pnpm build`) |
| `pnpm pack:check` | Dry-run pack all publishable packages |
| `pnpm exports:check` | Verify `@next-ai-ready/next` handler subpath exports |
| `pnpm bin:smoke` | CLI bin entry smoke (meta + next) |
| `pnpm lint` | ESLint on package sources (C-02) |
| `pnpm external:smoke` | Single-package install smoke |
| `pnpm verify:release` | Full pre-publish gate |
| `pnpm publish:alpha:interactive` | Build and publish missing package versions to npm `@alpha` |

### Package layout

```
packages/
  core/ semantic/ mdx/ llms/ actions/ openapi/ mcp/ next/ meta/
examples/docs-site/   — dogfood documentation site
scripts/              — e2e-smoke, publish-alpha, pack/exports checks
docs/                 — index: docs/README.md; ga-readiness, post-ga, backlog
examples/recipes/     — action-auth, upstash-ratelimit
```

### Manual UX validation (0.1 DoD)

Automated: `pnpm external:smoke` and `node scripts/e2e-smoke.mjs` cover init → build → doctor.

Preferred path: [docs/quickstart-10min.md](./docs/quickstart-10min.md).

Optional full 10-minute path (run **outside** the monorepo):

```bash
mkdir /tmp/nair-ux && cd /tmp/nair-ux
pnpm create next-app@latest . --ts --app --no-eslint
pnpm add next-ai-ready@alpha zod@^4
npx next-ai-ready@alpha init && npx next-ai-ready@alpha build
pnpm dev   # then curl http://localhost:3000/llms.txt
```

## Making changes

1. **Read** [`docs/backlog.md`](docs/backlog.md) for tracked items (IDs like `R-01`, `X-01`).
2. **Keep diffs focused** — match existing ESM + tsup + vitest patterns.
3. **Add tests** in the relevant package (`packages/*/test/`).
4. **Update backlog** — mark completed items `[x]` with date.
5. **Do not** commit secrets (`.npmrc` tokens, `.env`).

### Coding constraints

- Deterministic build output (`serializeStable()`; no timestamps in artifacts).
- Actions default to `public: false` (non-public → 404, not 403).
- `import "server-only"` only in Next route handlers, not in CLI/build code.

## Pull requests

- Ensure `pnpm test` and `pnpm typecheck` pass locally.
- CI runs build, test, typecheck, and `e2e-smoke.mjs` on every PR.
- Link backlog IDs or issue numbers in the PR description when applicable.

## Versioning & releases

We use [Changesets](https://github.com/changesets/changesets).
The [`0.1` public API and versioning policy](./docs/public-api-stability.zh-CN.md)
defines the protected entrypoints, SemVer rules, and deprecation process. Run
`pnpm api:check` after `pnpm build` whenever exports or public types change.
For incidents, follow the [npm/Git/Vercel rollback runbook](./docs/release-rollback.zh-CN.md);
the `pnpm rollback:plan -- ...` helper only prints registry commands for review.

### Pre-release (`@alpha`)

Current channel: **`0.1.0-alpha.x`**. Prepare and verify a release locally:

```bash
pnpm version:packages
pnpm verify:release
pnpm publish:alpha:interactive
```

Maintainers can instead run the **Release Alpha** GitHub Actions workflow and
enter `publish-alpha` when prompted. It runs the same release gate before
publishing and requires the repository secret `NPM_TOKEN`.

**npm auth:** use a [Granular Access Token](https://www.npmjs.com/settings/~tokens) with **Read and Write** on `@next-ai-ready/*` and **Bypass 2FA** enabled. Configure locally:

```bash
npm config set //registry.npmjs.org/:_authToken=YOUR_TOKEN
```

Never commit tokens. Do not paste tokens in chat or PRs.

The publish script checks npm first and skips versions that already exist, so a
partially completed release can be resumed safely.

### Stable release (future 0.1.0+)

When ready for a stable release:

```bash
pnpm changeset          # describe changes; select affected packages
pnpm version:packages   # apply version bumps + CHANGELOG
pnpm release            # build + changeset publish
pnpm changeset:status   # verify changeset wiring (E-04)
```

The root `release` script runs `turbo run build && changeset publish`.

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/completion-audit.md`](docs/completion-audit.md) | Completion status, 0.1 DoD |
| [`docs/backlog.md`](docs/backlog.md) | Full backlog (single source of truth) |
| [`docs/architecture.md`](docs/architecture.md) | System design |
| [`docs/external-quickstart-verification.md`](docs/external-quickstart-verification.md) | External user smoke test record |

## Out of scope

Please do not open PRs for: hosted SaaS, vector DB, chatbot UI, Pages Router support, or CMS integrations — see [`docs/backlog.md` §11](docs/backlog.md).

## Questions

Open a GitHub issue with context (Next.js version, repro steps, `next-ai-ready doctor --json` output if relevant).
