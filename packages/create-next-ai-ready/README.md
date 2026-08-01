# create-next-ai-ready

Create a minimal, runnable Next.js App Router TypeScript project with
`next-ai-ready` ready to initialize.

```bash
npm create next-ai-ready@alpha my-app
cd my-app
npm install
npx next-ai-ready init
npm run dev
```

The generated project includes:

- `app/layout.tsx` and `app/page.tsx`
- TypeScript and Next.js configuration
- `content/index.mdx` as the initial AI-readable page source
- Next.js, React, TypeScript, and `next-ai-ready` dependencies

The target must be a relative child path with lowercase package-safe components.
An existing empty directory is accepted. Existing files, non-empty directories,
absolute paths, path traversal, and symbolic-link paths are rejected and never
overwritten.
