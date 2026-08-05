# X launch package

## Single post

```text
Built next-ai-ready: an MIT-licensed App Router layer that adds llms.txt and per-page Markdown without changing your UI. Alpha; readability does not guarantee citations.

Tutorial: https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt
```

If the tracked URL makes the post too long, use the clean tutorial URL and retain campaign tracking
through the link shortener or analytics layer you control.

## Five-post technical thread

### Post 1

```text
What is the smallest useful AI-readable layer for a Next.js site?

For a small site: probably a hand-written public/llms.txt.

For a changing docs site: discovery and page Markdown need to stay synchronized. That is the problem I built next-ai-ready to test.
```

### Post 2

```text
The initial integration adds:

- /llms.txt and /llms-full.txt
- /<route>.md
- /sitemap.md

Your existing App Router UI stays unchanged. MCP and callable actions are optional later steps, not requirements for basic readability.
```

### Post 3

```text
Try it in a clean project:

npm create next-ai-ready@alpha next-ai-ready-demo
cd next-ai-ready-demo
npm install
npx next-ai-ready init
npm run build

Then inspect /llms.txt and /index.md.
```

### Post 4

```text
The live docs pass a pinned third-party agent-readability audit. Important limitation: that measures technical access, not whether an AI product will index, rank, quote, or cite the site. Those outcomes need separate analytics.
```

### Post 5

```text
MIT licensed and still alpha. I am looking for real Next.js blockers, especially Nextra/Fumadocs content discovery and production deployment constraints.

Tutorial: https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt
```

## 30-second video script

Format: `16:9` or `1:1`, captions always on, no background music required.

| Time | Visual | On-screen line |
| --- | --- | --- |
| 0-4 s | Existing Next.js page | Built for people |
| 4-8 s | Dense HTML response | Harder to retrieve cleanly |
| 8-15 s | Run generator and `init` | Add an AI-readable layer |
| 15-21 s | Show `/llms.txt` and `/index.md` | Discovery + page Markdown |
| 21-25 s | Return to original page | UI unchanged |
| 25-30 s | Tutorial and repository | Open source, alpha, feedback wanted |

Voiceover:

```text
Your Next.js UI can stay exactly as it is. This open-source App Router integration generates
llms.txt and per-page Markdown from the same content. Start with readability, verify the production
responses, and add agent actions only when you need them. It is alpha, and I am looking for real
integration feedback.
```

## Publishing cadence

- Publish the single post with the video.
- Use the thread only if the single post receives qualified technical engagement.
- Post a follow-up only when there is a real external integration, measured result, or meaningful
  release. Do not repeat the same launch text weekly.
