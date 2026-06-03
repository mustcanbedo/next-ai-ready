# Action auth recipe (GA readiness)

Public actions are callable by any client that can reach `/api/actions/<name>`. Unlike MCP (whole-endpoint gate), each action can enforce its own auth via `defineAction({ auth })`.

## API key (simple)

```ts
// actions/search.ts
import { defineAction } from "@next-ai-ready/actions";
import { z } from "zod";

export default defineAction({
  name: "search_docs",
  description: "Search documentation.",
  whenToUse: "When the user asks about product docs.",
  public: true,
  input: z.object({ q: z.string() }),
  auth: async (req) => {
    const key = req.headers.get("x-api-key");
    return key === process.env.ACTION_API_KEY;
  },
  async handler({ q }) {
    return { hits: [] };
  },
});
```

Clients send `x-api-key: <secret>`. Set `ACTION_API_KEY` in production.

## Session (Clerk / NextAuth)

```ts
import { auth } from "@clerk/nextjs/server";

auth: async () => {
  const { userId } = await auth();
  return !!userId;
},
```

Run session lookup inside `auth` so unauthenticated callers get **401** with `code: "unauthorized"`.

## Next.js middleware (rate limit + IP)

See [upstash-ratelimit](../upstash-ratelimit/README.md) for `/api/actions/*` middleware.

## MCP vs HTTP

| Surface | Default production guard |
|---------|-------------------------|
| `/api/mcp` | `NEXT_AI_READY_MCP_TOKEN` (Bearer) |
| `/api/actions/<name>` | Per-action `auth` or your middleware |

Doctor warns when MCP token is unset; it does not enforce action auth — that is intentional.

## Related

- [Actions guide](../../docs-site/content/en/docs/guides/actions.mdx) (docs-site)
- [quickstart-10min](../../../docs/quickstart-10min.md)
