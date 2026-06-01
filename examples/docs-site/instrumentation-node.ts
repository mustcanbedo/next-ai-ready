import "server-only";
import { registerAiHooks } from "@next-ai-ready/next/hooks";

/**
 * Node-only observability hooks for AI-bot analytics.
 * Loaded from instrumentation.ts when NEXT_RUNTIME === "nodejs".
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
