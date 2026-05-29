import { identifyAiBot } from "@next-ai-ready/core";
import type { AiReadyHooks, AiRequestInfo, InvokeInfo } from "@next-ai-ready/core";

/**
 * Process-global analytics hook registry.
 *
 * Hooks are *functions*, so unlike the graph/manifest they can't be
 * serialized to a build artifact — they must be registered in-process at
 * runtime. Users do this once (e.g. from Next's `instrumentation.ts`, or any
 * module imported by their route files):
 *
 *   import { registerAiHooks } from "@next-ai-ready/next";
 *   registerAiHooks({
 *     onAiRequest: (info) => analytics.track("ai_request", info),
 *     onInvoke:    (info) => analytics.track("ai_invoke", info),
 *   });
 *
 * If nothing is registered, the emit helpers are cheap no-ops.
 */
let hooks: AiReadyHooks = {};

export function registerAiHooks(h: AiReadyHooks): void {
  hooks = h;
}

export function clearAiHooks(): void {
  hooks = {};
}

/**
 * Fire `onAiRequest` for a served AI artifact. Never throws — observability
 * must not break the actual response. Bot identity is inferred from the UA.
 */
export async function emitAiRequest(req: Request, artifact: string): Promise<void> {
  if (!hooks.onAiRequest) return;
  const ua = req.headers.get("user-agent") ?? "";
  const info: AiRequestInfo = {
    bot: identifyAiBot(ua),
    ua,
    path: safePath(req.url),
    artifact,
  };
  try {
    await hooks.onAiRequest(info);
  } catch {
    /* swallow — see contract above */
  }
}

/** Fire `onInvoke` after an action call. Never throws. */
export async function emitInvoke(info: InvokeInfo): Promise<void> {
  if (!hooks.onInvoke) return;
  try {
    await hooks.onInvoke(info);
  } catch {
    /* swallow */
  }
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
