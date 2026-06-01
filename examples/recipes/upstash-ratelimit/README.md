# Upstash rate-limit recipe (P6-05)

Rate-limit action invocations before they hit your handlers.

## Middleware example

```ts
// middleware.ts — run before /api/actions/*
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, "1 m"),
});

export async function middleware(req: Request) {
  if (!req.nextUrl.pathname.startsWith("/api/actions/")) return;

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new Response(JSON.stringify({ ok: false, code: "rate_limited" }), { status: 429 });
  }
}

export const config = { matcher: ["/api/actions/:path*"] };
```

## Per-action auth

Combine with `defineAction({ auth: (req) => ... })` for Clerk/NextAuth session checks. See [`actions` guide](../../examples/docs-site/content/en/guides/actions.mdx).

## Env

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
