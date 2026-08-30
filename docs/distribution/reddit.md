# Reddit launch package

Target audience: Next.js maintainers who can evaluate the implementation and challenge its scope.
Before posting, read the current rules of the chosen community and do not post where project
showcases or self-promotion are prohibited.

## Suggested title

```text
I built an open-source way to add llms.txt and per-page Markdown to Next.js App Router; looking for integration feedback
```

## Post body

```markdown
Disclosure: I maintain the project linked below.

I have been working on a small MIT-licensed package called `next-ai-ready`. It adds machine-readable
content endpoints to an existing Next.js App Router application without replacing the human-facing
UI.

The basic integration generates:

- `/llms.txt` and `/llms-full.txt`
- `/<route>.md` for page-level retrieval
- `/sitemap.md`
- optional OpenAPI, MCP, and authenticated actions

For a small, rarely changing site, I still think a hand-written `public/llms.txt` is the better
solution. The package is intended for sites where routes, locales, summaries, and Markdown output
need to stay synchronized.

Minimal test:

```bash
npm create next-ai-ready@alpha next-ai-ready-demo
cd next-ai-ready-demo
npm install
npx next-ai-ready init
npm run build
```

The documentation deployment passes the pinned open-source Vercel Agent Readability audit, but I do
not treat that as evidence of ranking, indexing, or citation. It is only a reproducible technical
readability check.

Tutorial:
https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt?utm_source=reddit&utm_medium=community&utm_campaign=nextjs_llms_tutorial

Source:
https://github.com/mustcanbedo/next-ai-ready

I would especially value feedback on these questions:

1. Is the generated route-handler surface too large for an initial integration?
2. Should a docs/content adapter be the default instead of content globs?
3. Which production deployment constraint would stop you from trying this?

The project is still alpha. I would rather find concrete integration problems than collect generic
feature requests.
```

## 60-second landscape video script

Use the video only if the community accepts video demonstrations. The text post must remain useful
without it. The reproducible source is in [`video/`](./video/) under the
`NextAiReady-EN-Reddit` composition.

| Time | Visual | Voiceover |
| --- | --- | --- |
| 0-6 s | Show the unchanged UI beside `llms.txt`, page Markdown, and optional MCP | Keep the Next.js UI and add clean machine-facing endpoints. |
| 6-14 s | Show the pre-integration `llms.txt` 404 | Without discovery and stable page text, retrieval starts by guessing. |
| 14-24 s | Run the generator, install, and `init` | One public package adds the App Router layer; the UI is not replaced. |
| 24-32 s | Build deterministic `llms.txt`, page Markdown, and `sitemap.md` | The artifacts stay tied to the content already maintained by the app. |
| 32-40 s | Run locale-aware `search_pages`, then `get_page` | MCP search can find and read the installation page from the same semantic graph. |
| 40-48 s | Show the pinned production readability audit and disclaimer | Readability is verifiable, but it does not promise indexing, ranking, or citations. |
| 48-60 s | Show the exact command, tutorial, repository, and feedback request | The project is MIT licensed and alpha; concrete integration blockers are the goal. |

## Reply policy

- Answer criticism with source links, commands, or a minimal reproduction.
- Do not respond to every feature idea with a promise.
- Record repeated blockers in the product ledger.
- Do not direct-message commenters unless they explicitly invite it.
- If the post is removed, do not repost it under a different title in the same community.
