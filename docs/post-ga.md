# Post-GA optimizations

Items **intentionally deferred** until after **0.1 GA**. Not blockers for recommending `next-ai-ready@alpha` to early adopters.

**Tracking:** add new IDs to [backlog.md §13](./backlog.md#13-post-ga-产品与-dx) when work starts; mark `[x]` when shipped.

---

## Shipped ahead of GA

| ID | Topic | Result |
|----|-------|--------|
| PG-18 | **Audit v2 dimensions** | Implemented as the opt-in `next-ai-ready.audit.v2` schema with `discovery`, `content-citation`, `structured-data`, `agent-access`, and `capabilities` scores. Audit v1 remains the default compatibility path. |
| PG-19 | **MCP page list/search tools** | Implemented bounded `list_pages`, `get_page`, and deterministic local `search_pages` over SemanticGraph; tools register automatically when a graph is supplied. |

---

## P1 — High value (0.2.x)

| ID | Topic | Why | Suggested approach |
|----|-------|-----|-------------------|
| PG-01 | **Single-track docs template** | `create-next-ai-ready` defaults to one MDX pipeline; reduces dual-track confusion | Template uses shared MDX renderer or Fumadocs-style single source |
| PG-02 | **Locale-aware `llms.txt` sections** | Graph has `routesByLocale`; llms curation is manual per locale | Config helper `llms.sectionsByLocale` or auto section from route prefix |
| PG-03 | **Optional `ACTION_API_KEY` gate** | HTTP actions lack global env gate (MCP has token) | Env + middleware recipe promoted to core docs; optional `actions.globalAuth` |
| PG-04 | **CI artifact drift everywhere** | Only docs-site has `check-artifacts-drift.mjs` | Reusable script in `next-ai-ready` CLI: `doctor --check-artifacts` |
| PG-05 | **npm GA tag `0.1.0`** | Drop `@alpha` install path | Changeset + README status “stable 0.1” |

---

## P2 — Product / DX

| ID | Topic | Why | Suggested approach |
|----|-------|-----|-------------------|
| PG-06 | **ContentSource adapters** | TSX-only sites cannot feed graph without parallel MDX | Ship CMS/file adapters from [phase6-design.md](./phase6-design.md) |
| PG-07 | **SemanticProvider / LLM enrich** | Manual `questions` / `summary` labor | Build-time optional enrich hook |
| PG-08 | **Simpler onboarding** | init + stubs + withAiReady + prebuild is heavy | `doctor --fix` codemods; fewer files in template |
| PG-09 | **Full MDX in UI** | Docs-site `MdxContent` is subset | Integrate `@next/mdx` or document “use your docs framework” |
| PG-10 | **Edge Knowledge handlers** | All handlers `nodejs` today | P6-04 full port when graph loader stable on Edge |
| PG-11 | **MCP locale resources** | Agents may pull wrong locale page | Filter `airead://page` by `Accept-Language` or route prefix |
| PG-12 | **HTTP action observability** | `onInvoke` exists; no first-party dashboard | Recipes only; stay out of SaaS scope |
| PG-20 | **Optional runtime index providers** | Very large or frequently changing corpora may outgrow build-time graph search | Provider contract first; SQLite/Postgres adapters only after production evidence |
| PG-21 | **IndexNow + Content Signals** | Useful ecosystem interoperability, but independent of core retrieval | Small opt-in emitters with external compatibility tests |

---

## P3 — Polish / maintenance

| ID | Topic | Notes |
|----|-------|-------|
| PG-13 | Archive or trim **REVIEW.md** | Already marked superseded |
| PG-14 | **completion-audit** body refresh | §2–7 tables lag; keep §1 + §9 as living summary |
| PG-15 | **Package README** deep links | Link each package to tactics it implements |
| PG-16 | **Snapshot tests** for OpenAPI/tools | Prevent accidental format breaks |
| PG-17 | **gitignore policy doc** | Document “commit public/” vs “prebuild only” for adopters |

---

## Explicitly out of scope (do not schedule)

- Hosted analytics SaaS
- Built-in vector DB / RAG
- Chatbot UI
- Pages Router support
- `output: 'export'` static sites

From [goals.md](./goals.md) and [backlog.md §11](./backlog.md#11-明确-out-of-scope勿提案).

---

## How this relates to Phase 6

Phase 6 **foundation** (locale graph, content sources, embeddings hook, recipes) is largely in code. Post-GA work is **productizing** those APIs for typical Next teams, not re-architecting the two planes.
