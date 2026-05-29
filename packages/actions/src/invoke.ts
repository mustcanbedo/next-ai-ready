import type { ActionContext } from "@next-ai-ready/core";
import { getAction } from "./registry.js";

/**
 * Build a full `ActionContext` from a Fetch API `Request`. Exported because
 * the Next route handler also needs to construct one before calling into
 * userland — keeping the construction logic in one place avoids drift.
 */
export function buildActionContext(request: Request, extras: { caller?: string } = {}): ActionContext {
  const headers = request.headers;
  return {
    request,
    headers,
    cookies: {
      get(name: string) {
        const raw = headers.get("cookie") ?? "";
        for (const part of raw.split(/;\s*/)) {
          const eq = part.indexOf("=");
          if (eq < 0) continue;
          if (decodeURIComponent(part.slice(0, eq)) === name) {
            return { value: decodeURIComponent(part.slice(eq + 1)) };
          }
        }
        return undefined;
      },
    },
    caller: extras.caller,
  };
}

export interface InvokeResultOk<O = unknown> {
  ok: true;
  data: O;
  action: string;
  latencyMs: number;
}
export interface InvokeResultErr {
  ok: false;
  action: string;
  latencyMs: number;
  status: number;
  code: "not_found" | "not_public" | "unauthorized" | "invalid_input" | "handler_error";
  message: string;
  details?: unknown;
}
export type InvokeResult<O = unknown> = InvokeResultOk<O> | InvokeResultErr;

/**
 * Resolve + validate + call one action by name.
 *
 * This is the heart of the Capability plane. The runtime route handler in
 * `@next-ai-ready/next` is a thin wrapper around this — it parses the
 * Request body and turns `InvokeResult` into a `Response`.
 *
 * Security rules (ADR-010):
 *   • Action MUST have `public: true` to be reachable.
 *   • If `auth` is defined, it MUST return truthy.
 *   • Input MUST pass `safeParse`. We never throw raw zod errors back.
 */
export async function invokeAction(
  name: string,
  rawInput: unknown,
  ctxOrRequest: ActionContext | Request,
): Promise<InvokeResult> {
  const ctx: ActionContext = ctxOrRequest instanceof Request ? buildActionContext(ctxOrRequest) : ctxOrRequest;
  const t0 = Date.now();
  const action = getAction(name);
  if (!action) {
    return { ok: false, action: name, latencyMs: 0, status: 404, code: "not_found", message: `Unknown action: ${name}` };
  }
  if (!action.public) {
    return { ok: false, action: name, latencyMs: 0, status: 404, code: "not_public", message: `Action "${name}" is not exposed.` };
  }
  if (action.auth) {
    const allowed = await action.auth(ctx.request);
    if (!allowed) {
      return { ok: false, action: name, latencyMs: Date.now() - t0, status: 401, code: "unauthorized", message: "Unauthorized." };
    }
  }
  const parsed = action.input.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      action: name,
      latencyMs: Date.now() - t0,
      status: 400,
      code: "invalid_input",
      message: "Invalid input.",
      details: extractZodIssues(parsed.error),
    };
  }
  try {
    const data = await action.handler(parsed.data, ctx);
    return { ok: true, action: name, latencyMs: Date.now() - t0, data };
  } catch (err) {
    return {
      ok: false,
      action: name,
      latencyMs: Date.now() - t0,
      status: 500,
      code: "handler_error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function extractZodIssues(err: unknown): unknown {
  if (err && typeof err === "object" && "issues" in err) {
    return (err as { issues: unknown }).issues;
  }
  return undefined;
}
