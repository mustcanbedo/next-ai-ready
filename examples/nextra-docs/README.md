# Nextra 4 compatibility fixture

This example is an executable compatibility contract for Nextra 4 and `next-ai-ready`. Nextra owns
the documentation UI; `next-ai-ready` reads the same `content/` MDX collection and adds the Knowledge
Plane endpoints.

This is a first-party workspace-source demonstration, not an independent npm latest installation,
external adoption, Nextra endorsement, or search-traffic result. The [illustrated integration guide](https://nextaiready.com/en/docs/guides/nextra-ai-ready)
records the Nextra `4.6.1`, Next.js `16.2.6`, React `19.2.4` production checks on 2026-10-02.

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

To inspect the UI, run `corepack pnpm --filter @next-ai-ready/example-nextra-docs start --hostname 127.0.0.1 --port 3321`
and open `http://127.0.0.1:3321/getting-started`. The canonical host `nextra-fixture.example` is only a
placeholder; replace `site.baseUrl` with a real production domain before deploying and rebuild.

The HTTP contracts pass, but the current fixture's `doctor` still reports five warnings: Knowledge-only
OpenAPI, JavaScript route stubs, and workspace CLI prebuild wiring are not recognized by its heuristics;
author metadata and JSON-LD are not configured. These diagnostics are not a search-ranking score.
