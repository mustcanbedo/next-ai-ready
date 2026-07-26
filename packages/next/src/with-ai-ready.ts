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
 *
 * Usage:
 *   // next.config.mjs
 *   import { withAiReady } from "@next-ai-ready/next"
 *   export default withAiReady()({ ...yourNextConfig })
 */

type HeaderCondition = { type: "header"; key: string; value: string };
type RewriteEntry = { source: string; destination: string; has?: HeaderCondition[] };
type RewriteResult = RewriteEntry[] | { beforeFiles?: RewriteEntry[]; afterFiles?: RewriteEntry[]; fallback?: RewriteEntry[] };
type HeaderEntry = { source: string; headers: Array<{ key: string; value: string }> };

type AnyConfig = Record<string, unknown> & {
  rewrites?: () => Promise<RewriteResult> | RewriteResult;
  headers?: () => Promise<HeaderEntry[]> | HeaderEntry[];
  outputFileTracingIncludes?: Record<string, string[]>;
  experimental?: Record<string, unknown>;
};

export interface AgentReadableOptions {
  /** Serve the Markdown representation when `Accept: text/markdown` is present. Default: true. */
  accept?: boolean;
  /** Serve Markdown to known agent user agents, or provide a custom list. Default: false. */
  userAgents?: boolean | string[];
}

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
  /**
   * Add request-aware Markdown rewrites and the corresponding `Vary` header.
   * `true` enables both Accept negotiation and the built-in agent UA list.
   * An object enables Accept negotiation by default and makes UA routing opt-in.
   * @default false
   */
  agentReadable?: boolean | AgentReadableOptions;
}

const PAGE_SOURCE = "/:path((?!_next|_ai-ready|api|.*\\..*).*)";
const DEFAULT_AGENT_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "anthropic-ai",
  "Google-Extended",
  "Vercelbot",
  "Vercel-Agent",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveAgentReadable(option: WithAiReadyOptions["agentReadable"]): {
  accept: boolean;
  userAgents: string[];
} {
  if (!option) return { accept: false, userAgents: [] };
  if (option === true) return { accept: true, userAgents: DEFAULT_AGENT_USER_AGENTS };
  const userAgents =
    option.userAgents === true
      ? DEFAULT_AGENT_USER_AGENTS
      : Array.isArray(option.userAgents)
        ? option.userAgents
        : [];
  return { accept: option.accept ?? true, userAgents };
}

export function withAiReady(opts: WithAiReadyOptions = {}) {
  const enableRewrites = opts.rewrites ?? true;
  const enableTracing = opts.fileTracing ?? true;
  const agentReadable = resolveAgentReadable(opts.agentReadable);

  return function applyAiReady<C extends AnyConfig>(userConfig: C = {} as C): C {
    const next: C = { ...userConfig };

    if (enableRewrites) {
      const prior = userConfig.rewrites;
      next.rewrites = async () => {
        const negotiated: RewriteEntry[] = [];
        if (agentReadable.accept) {
          negotiated.push({
            source: PAGE_SOURCE,
            destination: "/_ai-ready/md/:path*",
            has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          });
        }
        if (agentReadable.userAgents.length > 0) {
          const value = `.*(?:${agentReadable.userAgents.map(escapeRegExp).join("|")}).*`;
          negotiated.push({
            source: PAGE_SOURCE,
            destination: "/_ai-ready/md/:path*",
            has: [{ type: "header", key: "user-agent", value }],
          });
        }
        const ours: RewriteEntry[] = [
          { source: "/llms.txt", destination: "/_ai-ready/llms-txt" },
          { source: "/llms-full.txt", destination: "/_ai-ready/llms-full" },
          { source: "/:path*.md", destination: "/_ai-ready/md/:path*" },
          { source: "/:path*.ai.json", destination: "/_ai-ready/ai-json/:path*" },
          // Capability plane — canonical paths match static `public/` output.
          { source: "/openapi.json", destination: "/_ai-ready/openapi" },
          { source: "/tools.json", destination: "/_ai-ready/tools" },
          { source: "/.well-known/ai-plugin.json", destination: "/_ai-ready/ai-plugin" },
          // Backward-compatible aliases under /api/.
          { source: "/api/openapi.json", destination: "/_ai-ready/openapi" },
          { source: "/api/tools.json", destination: "/_ai-ready/tools" },
        ];
        const upstream = typeof prior === "function" ? await prior() : undefined;
        // Next.js rewrites() can return either a flat array or an object with
        // { beforeFiles, afterFiles, fallback }. We support both forms.
        if (!upstream) {
          return negotiated.length > 0
            ? { beforeFiles: negotiated, afterFiles: ours, fallback: [] }
            : ours;
        }
        if (Array.isArray(upstream)) {
          return negotiated.length > 0
            ? { beforeFiles: negotiated, afterFiles: [...upstream, ...ours], fallback: [] }
            : [...upstream, ...ours];
        }
        return {
          beforeFiles: [...(upstream.beforeFiles ?? []), ...negotiated, ...ours],
          afterFiles: upstream.afterFiles ?? [],
          fallback: upstream.fallback ?? [],
        };
      };
    }

    const vary = enableRewrites
      ? [
          agentReadable.accept ? "Accept" : "",
          agentReadable.userAgents.length > 0 ? "User-Agent" : "",
        ].filter(Boolean)
      : [];
    if (vary.length > 0) {
      const prior = userConfig.headers;
      next.headers = async () => {
        const upstream = typeof prior === "function" ? await prior() : [];
        return [
          ...upstream,
          {
            source: PAGE_SOURCE,
            headers: [{ key: "Vary", value: vary.join(", ") }],
          },
        ];
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
