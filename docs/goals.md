# Goals — North Star

> SEO optimizes for browsers. `next-ai-ready` optimizes for **AI consumers**.

## Why this exists

The way users discover information and interact with the web is shifting:

- **Discovery is moving from SERPs to AI answers.** ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews answer questions directly. The site that gets **cited** wins; the site that gets indexed loses.
- **Interaction is moving from clicks to agents.** Increasingly, an AI agent visits your site **on behalf of the user** to perform a task (search, compare, book, buy). The site that exposes **callable capabilities** wins; the site that only renders HTML loses.

Therefore: a modern website must serve **two new consumers** in addition to the browser:

1. **AI search engines** → need your knowledge in machine-readable form.
2. **AI agents** → need your features in machine-callable form.

## The product objective

> Make any Next.js site **citable by AI** and **callable by agents**, with zero changes to its UI.

## Two planes, two KPIs

| Plane          | Question we answer                                   | Primary KPI                                |
| -------------- | ---------------------------------------------------- | ------------------------------------------ |
| **Knowledge**  | "Will an AI cite my page when a user asks?"          | AI citation rate; AI crawler hits per page |
| **Capability** | "Will an agent invoke my feature instead of guessing?" | Action invocations; tool selection accuracy |

Everything in the framework must serve one of these two KPIs. If a feature doesn't, it doesn't belong in MVP.

## What we are NOT

To stay focused, `next-ai-ready` is explicitly **not**:

- ❌ A SaaS / hosted service / dashboard
- ❌ A CMS or docs site framework (fumadocs covers that)
- ❌ A chatbot SDK (Vercel AI SDK / LangChain covers that)
- ❌ A vector database or embedding service
- ❌ A browser-automation / scraping tool
- ❌ A robots.txt-only generator (too narrow)

It **is**:

- ✅ A Next.js framework layer (plugin + runtime + CLI)
- ✅ Developer infra (lives in your repo, runs at build time)
- ✅ Multi-emitter (one source → many AI-readable formats)
- ✅ Composable (every package independently usable)

## Operating principle

> "Same source of truth, many consumers."

Your MDX content and your `defineAction` declarations are the **single source**. Browsers, LLMs, AI search, and agents all get consistent, derived views.

This is the unfair advantage that comes from being a **framework layer** instead of a marketing tool: the knowledge plane (docs) and the capability plane (API) share types, validation, and lifecycle.

## Concrete tactics derived from the goals

These tactics map 1:1 to features in the framework. Every roadmap item must trace back to one of these.

### Knowledge plane (be cited by AI)

| # | Tactic                                                                 | Where in framework            |
| - | ---------------------------------------------------------------------- | ----------------------------- |
| K1 | Publish a hand-curated `llms.txt` (not full dump)                     | `@next-ai-ready/llms`         |
| K2 | Serve raw Markdown at `/<route>.md` for AI ingestion                  | `@next-ai-ready/llms`         |
| K3 | Serve structured semantic JSON at `/<route>.ai.json`                  | `@next-ai-ready/semantic`     |
| K4 | Emit JSON-LD (`Article`, `FAQPage`, `WebPage`, `Organization`)        | `@next-ai-ready/semantic`     |
| K5 | Every fact has a stable URL anchor (`#install`, `#pricing`)           | `@next-ai-ready/mdx`          |
| K6 | Every page declares `updatedAt`, `author`, optional `reviewedBy`      | `core/types.ts`               |
| K7 | Token-aware chunking respecting heading boundaries                    | `@next-ai-ready/mdx`          |
| K8 | FAQ extraction (frontmatter + heuristic Q/A detection)                | `@next-ai-ready/mdx`          |
| K9 | `robots.txt` helper that **allows** AI crawlers by default            | `@next-ai-ready/next`         |
| K10 | `doctor` CLI: detects `noai`, blocked GPTBot, missing JSON-LD        | `@next-ai-ready/next` (CLI)   |
| K11 | AI crawler analytics (`onAiRequest` hook, identifies GPTBot etc.)    | `@next-ai-ready/next`         |
| K12 | MDX → clean Markdown (strip React components or map to text)         | `@next-ai-ready/mdx`          |

### Capability plane (be called by agents)

| # | Tactic                                                                | Where in framework            |
| - | --------------------------------------------------------------------- | ----------------------------- |
| C1 | `defineAction` with Zod input/output                                  | `@next-ai-ready/actions`      |
| C2 | `whenToUse` / `whenNotToUse` fields (improve tool selection accuracy) | `@next-ai-ready/actions`      |
| C3 | Auto-generate OpenAPI 3.1 from registry                               | `@next-ai-ready/openapi`      |
| C4 | Auto-generate generic tool manifest (`/tools.json`)                   | `@next-ai-ready/openapi`      |
| C5 | Auto-generate `/.well-known/ai-plugin.json`                           | `@next-ai-ready/openapi`      |
| C6 | MCP server (Streamable HTTP + stdio) over `vercel/mcp-handler`        | `@next-ai-ready/mcp`          |
| C7 | Default deny: actions must opt-in via `public: true`                  | `@next-ai-ready/actions`      |
| C8 | Invocation hook for analytics / rate limit / auth                     | `@next-ai-ready/actions`      |
| C9 | Examples field surfaced to agents (`x-ai-examples`)                   | `@next-ai-ready/openapi`      |
| C10 | Strict input validation with structured error messages                | `@next-ai-ready/actions`      |
| C11 | Server-only enforcement (`import "server-only"`)                      | `@next-ai-ready/actions`      |
| C12 | MCP exposes the SemanticGraph as `resources/*` (free side effect)     | `@next-ai-ready/mcp`          |

Total: **24 concrete tactics**, each verifiable. The `doctor` CLI will eventually score a site against this list.

## How we'll know we won

Eventually, success looks like:

- A user running `npx next-ai-ready doctor` on any Next site and getting an actionable AEO + Agent-readiness score.
- AI search results citing pages with `.md` URLs because they're the most ingestion-friendly version.
- Agents (Claude Desktop, custom GPTs, autonomous frameworks) discovering and calling `defineAction` endpoints via `/api/mcp` without bespoke integration code.

If we ship that, the framework matters.
