/**
 * `withAiReady()` — Next.js config wrapper.
 *
 * It does as little as possible (ADR-006): no bundler plugins, no virtual
 * modules. The compilation pipeline runs in a separate `next-ai-ready build`
 * CLI step and writes JSON artifacts to `.next-ai-ready/`.
 *
 * What this wrapper IS responsible for:
 *   1. Rewriting `/:path*.md` → `/_ai-ready/md/:path*`
 *      and `/:path*.ai.json` → `/_ai-ready/ai-json/:path*`
 *      so user-friendly URLs work without the user touching their routes.
 *   2. Ensuring `.next-ai-ready/*.json` ships with serverless function
 *      bundles via `outputFileTracingIncludes`.
 *   3. Setting CORS-friendly headers for AI consumer endpoints (configurable).
 *
 * Usage:
 *   // next.config.mjs
 *   import { withAiReady } from "@next-ai-ready/next"
 *   export default withAiReady()({ ...yourNextConfig })
 */

type RewriteEntry = { source: string; destination: string };
type RewriteResult = RewriteEntry[] | { beforeFiles?: RewriteEntry[]; afterFiles?: RewriteEntry[]; fallback?: RewriteEntry[] };

type AnyConfig = Record<string, unknown> & {
  rewrites?: () => Promise<RewriteResult> | RewriteResult;
  outputFileTracingIncludes?: Record<string, string[]>;
  experimental?: Record<string, unknown>;
};

export interface WithAiReadyOptions {
  /**
   * Disable URL rewrites if you want to mount the AI routes yourself.
   * @default true
   */
  rewrites?: boolean;
  /**
   * Disable file tracing inclusion if you're using a custom deployment
   * adapter that ships the whole project.
   * @default true
   */
  fileTracing?: boolean;
}

export function withAiReady(opts: WithAiReadyOptions = {}) {
  const enableRewrites = opts.rewrites ?? true;
  const enableTracing = opts.fileTracing ?? true;

  return function applyAiReady<C extends AnyConfig>(userConfig: C = {} as C): C {
    const next: C = { ...userConfig };

    if (enableRewrites) {
      const prior = userConfig.rewrites;
      next.rewrites = async () => {
        const ours: RewriteEntry[] = [
          { source: "/llms.txt", destination: "/_ai-ready/llms-txt" },
          { source: "/llms-full.txt", destination: "/_ai-ready/llms-full" },
          { source: "/:path*.md", destination: "/_ai-ready/md/:path*" },
          { source: "/:path*.ai.json", destination: "/_ai-ready/ai-json/:path*" },
          // Capability plane endpoints — `/api/...` paths are the canonical
          // surface that OpenAPI / tools.json reference internally.
          { source: "/api/openapi.json", destination: "/_ai-ready/openapi" },
          { source: "/api/tools.json", destination: "/_ai-ready/tools" },
        ];
        const upstream = typeof prior === "function" ? await prior() : undefined;
        // Next.js rewrites() can return either a flat array or an object with
        // { beforeFiles, afterFiles, fallback }. We support both forms.
        if (!upstream) return ours;
        if (Array.isArray(upstream)) return [...upstream, ...ours];
        return {
          beforeFiles: [...(upstream.beforeFiles ?? []), ...ours],
          afterFiles: upstream.afterFiles ?? [],
          fallback: upstream.fallback ?? [],
        };
      };
    }

    if (enableTracing) {
      const existing = userConfig.outputFileTracingIncludes ?? {};
      next.outputFileTracingIncludes = {
        ...existing,
        "/_ai-ready/**/*": [".next-ai-ready/**/*"],
      };
    }

    return next;
  };
}
