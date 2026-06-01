import { registerAiHooks } from "@next-ai-ready/next";

/**
 * Register observability hooks for AI-bot analytics.
 *
 * This file is imported by Next.js's `instrumentation.ts` convention.
 * It runs once per process and wires up the hooks that fire whenever an
 * AI crawler fetches an artifact or an agent invokes an action.
 *
 * Replace the `console.log` calls below with your own analytics backend
 * (e.g. PostHog, Segment, or a custom event table).
 */
registerAiHooks({
  onAiRequest(info) {
    console.log("[ai-request]", {
      bot: info.bot ?? "unknown",
      artifact: info.artifact,
      path: info.path,
      ua: info.ua,
    });
  },
  onInvoke(info) {
    console.log("[ai-invoke]", {
      action: info.action,
      ok: info.ok,
      latencyMs: info.latencyMs,
      caller: info.caller ?? "unknown",
      ...(info.error ? { error: info.error.message, code: info.error.code } : {}),
    });
  },
});
