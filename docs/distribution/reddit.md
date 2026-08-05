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
without it.

| Time | Visual | Voiceover |
| --- | --- | --- |
| 0-6 s | Existing Next.js page beside its HTML response | A normal Next.js page is optimized for browsers, but retrieval tools often need a cleaner representation. |
| 6-14 s | Show a hand-written `public/llms.txt` | For a small site, this static file may be all you need. |
| 14-26 s | Run the project generator and `init` | For larger or multilingual sites, I am testing a generated approach that keeps discovery and Markdown routes tied to content. |
| 26-38 s | Open `/llms.txt`, `/index.md`, and the original `/` | The UI remains unchanged while machine-facing endpoints expose concise, readable content. |
| 38-48 s | Run `doctor --score`; highlight the disclaimer | The audit checks technical accessibility. It does not promise indexing, ranking, or citations. |
| 48-60 s | Show the small generated diff and the three feedback questions | The project is alpha. I am looking for integration objections, especially around route count, content adapters, and deployment constraints. |

## Reply policy

- Answer criticism with source links, commands, or a minimal reproduction.
- Do not respond to every feature idea with a promise.
- Record repeated blockers in the product ledger.
- Do not direct-message commenters unless they explicitly invite it.
- If the post is removed, do not repost it under a different title in the same community.
