# Nextra 4 compatibility fixture

This example is an executable compatibility contract for Nextra 4 and `next-ai-ready`. Nextra owns
the documentation UI; `next-ai-ready` reads the same `content/` MDX collection and adds the Knowledge
Plane endpoints.

The [illustrated integration guide](https://nextaiready.com/en/docs/guides/nextra-ai-ready)
records the workspace-source production checks with Nextra `4.6.1`, Next.js `16.2.6`, and React
`19.2.4` on 2026-10-02.

The repository pins Nextra's internal Zod dependency to `4.3.6`. Nextra `4.6.1` currently declares a
range that can resolve to Zod `4.4.x`, but that combination breaks `nextra-theme-docs` layout
validation ([upstream issue #4989](https://github.com/shuding/nextra/issues/4989),
[#5036](https://github.com/shuding/nextra/issues/5036)). The application still uses Zod `4.4.x` for
`next-ai-ready`; only Nextra's private dependency is pinned.

## Run it

From the repository root:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm --filter next-ai-ready... build
corepack pnpm --filter @next-ai-ready/example-nextra-docs build
corepack pnpm --filter @next-ai-ready/example-nextra-docs test
```

The production smoke test verifies:

| Surface | Contract |
| --- | --- |
| Nextra HTML | `/` and `/getting-started` render the docs theme |
| Discovery | `/llms.txt` lists the shared MDX pages |
| Full corpus | `/llms-full.txt` contains the page body and curated FAQ |
| Explicit Markdown | `/getting-started.md` returns clean Markdown and a canonical link |
| Structured page | `/getting-started.ai.json` returns the semantic page representation |
| Negotiation | `Accept: text/markdown` returns the same page as Markdown |
| Missing browser page | A normal HTML request remains `404` |
| Missing agent page | A Markdown request returns a recoverable, noindex document |

This fixture intentionally excludes MCP and callable actions. Add those only when a documentation
site has a concrete agent workflow and an authentication policy.

## Reproduce with the published npm package

From the repository root, use Node.js 22 and Corepack to run the standalone compatibility check:

```bash
node examples/nextra-docs/scripts/public-registry-smoke.mjs 0.1.0-alpha.22
```

On 2026-11-23, the public-registry run with Node.js `22.22.1` and pnpm `9.12.0` passed the
production build, one shared-content graph check, and nine HTTP responses in a temporary app.
It resolved Zod `4.3.6` for Nextra and its theme, and Zod `4.4.3` for the published SDK.
The standalone `doctor` reported **0 errors and 3 warnings** for JavaScript route detection, missing
author metadata, and missing JSON-LD on the example pages.

## Inspect the workspace fixture

To inspect the UI, run `corepack pnpm --filter @next-ai-ready/example-nextra-docs start --hostname 127.0.0.1 --port 3321`
and open `http://127.0.0.1:3321/getting-started`. The canonical host `nextra-fixture.example` is only a
placeholder; replace `site.baseUrl` with a real production domain before deploying and rebuild.

The 2026-10-02 workspace-source run's `doctor` reported five warnings: Knowledge-only
OpenAPI, JavaScript route stubs, and workspace CLI prebuild wiring are not recognized by its heuristics;
author metadata and JSON-LD are not configured. These diagnostics are not a search-ranking score.
