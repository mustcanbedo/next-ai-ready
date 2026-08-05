# Distribution kit

This directory turns one verified product result into platform-specific launch material. The live
documentation remains the canonical source; social posts should point back to it instead of copying
the whole documentation set.

## Canonical links

- English tutorial: https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt
- Chinese tutorial: https://next-ai-ready.vercel.app/zh/docs/guides/nextjs-llms-txt
- Repository: https://github.com/mustcanbedo/next-ai-ready
- Production `llms.txt`: https://next-ai-ready.vercel.app/llms.txt
- Reproducible audit evidence: https://github.com/mustcanbedo/next-ai-ready/blob/main/docs/audit-baselines/vercel-agent-readability-0.5.0-2026-08-01.json

## Platform packages

| Platform | Material | Primary goal |
| --- | --- | --- |
| Xiaohongshu | [xiaohongshu.zh-CN.md](./xiaohongshu.zh-CN.md) | Explain the problem visually and earn qualified Chinese developer visits. |
| Reddit | [reddit.md](./reddit.md) | Start a technical discussion and collect integration objections. |
| X | [x.md](./x.md) | Deliver a compact demo that can be shared by Next.js developers. |

## Publishing rules

1. Publish the live tutorial first and verify its HTML and `.md` URLs.
2. Use one platform-specific UTM link per post.
3. Disclose that the poster maintains the project.
4. Never claim that `llms.txt`, an audit score, or this package guarantees indexing, ranking, or
   citation.
5. Do not publish the same text to several communities at once. Adapt the opening and question to
   each audience.
6. Answer technical comments with reproducible commands or source links. Do not argue with a lack
   of interest.
7. Record outcomes after 24 hours and seven days.

## Measurement

Use these URLs for the first run:

```text
Xiaohongshu
https://next-ai-ready.vercel.app/zh/docs/guides/nextjs-llms-txt?utm_source=xiaohongshu&utm_medium=social&utm_campaign=nextjs_llms_tutorial

Reddit
https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt?utm_source=reddit&utm_medium=community&utm_campaign=nextjs_llms_tutorial

X
https://next-ai-ready.vercel.app/en/docs/guides/nextjs-llms-txt?utm_source=x&utm_medium=social&utm_campaign=nextjs_llms_tutorial
```

Track the funnel rather than impressions alone:

```text
post impression
-> tutorial visit
-> repository visit
-> package install or starter creation
-> doctor passes
-> deployed external site
```

The first useful signals are tutorial visits, repository visits, questions, and failed setup steps.
The success metric is an external project reaching a working deployment, not raw npm downloads.

## Asset capture checklist

Record one clean terminal session and reuse it across all three edits:

```bash
npm create next-ai-ready@alpha next-ai-ready-demo
cd next-ai-ready-demo
npm install
npx next-ai-ready init
npm run build
npm run dev
```

Capture these proof shots:

- the generator completing successfully;
- `doctor` showing zero errors;
- `/llms.txt` in the browser;
- `/index.md` in the browser;
- the unchanged human-facing homepage;
- the public audit evidence with the technical-readability disclaimer visible.

Do not record tokens, `.env` contents, email addresses, browser bookmarks, or unrelated terminal
history.
