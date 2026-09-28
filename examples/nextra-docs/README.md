# Nextra 4 compatibility fixture

This example is an executable compatibility contract for Nextra 4 and `next-ai-ready`. Nextra owns
the documentation UI; `next-ai-ready` reads the same `content/` MDX collection and adds the Knowledge
Plane endpoints.

The repository pins Nextra's internal Zod dependency to `4.3.6`. Nextra `4.6.1` currently declares a
range that can resolve to Zod `4.4.x`, but that combination breaks `nextra-theme-docs` layout
validation ([upstream issue #4989](https://github.com/shuding/nextra/issues/4989),
[#5036](https://github.com/shuding/nextra/issues/5036)). The application still uses Zod `4.4.x` for
`next-ai-ready`; only Nextra's private dependency is pinned.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter @next-ai-ready/example-nextra-docs build
pnpm --filter @next-ai-ready/example-nextra-docs test
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
