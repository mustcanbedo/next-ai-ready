import "server-only";
import { invokeAction } from "@next-ai-ready/actions";
import { identifyAiBot } from "@next-ai-ready/core";
import { emitInvoke } from "../runtime/observability.js";

/**
 * `POST /<basePath>/[name]` — execute one action by name.
 *
 * Wire-up: `app/_ai-ready/actions/[name]/route.ts` should look like:
 *
 *   import "@/actions"            // side-effect: populate the registry
 *   export { POST } from "@next-ai-ready/next/handlers/action"
 *   export const runtime = "nodejs"
 *
 * The import-for-side-effects pattern keeps user code and our handler
 * decoupled — we never reach into the user's project to find their actions.
 */
export async function POST(req: Request, ctx: { params: Promise<{ name?: string }> | { name?: string } }) {
  const { name } = await Promise.resolve(ctx.params);
  if (!name) return jsonResponse({ ok: false, code: "not_found", message: "Missing action name." }, 404);

  let input: unknown = {};
  if (req.body) {
    try {
      input = await req.json();
    } catch {
      return jsonResponse({ ok: false, code: "invalid_input", message: "Body must be valid JSON." }, 400);
    }
  }

  const result = await invokeAction(name, input, req);

  // Fire the analytics hook (never blocks/breaks the response).
  await emitInvoke({
    action: result.action,
    latencyMs: result.latencyMs,
    ok: result.ok,
    error: result.ok ? undefined : { message: result.message, code: result.code },
    caller: identifyAiBot(req.headers.get("user-agent")),
  });

  if (result.ok) {
    return jsonResponse(
      { ok: true, data: result.data },
      200,
      { "x-action": result.action, "x-latency-ms": String(result.latencyMs) },
    );
  }
  return jsonResponse(
    { ok: false, code: result.code, message: result.message, details: result.details },
    result.status,
    { "x-action": result.action, "x-latency-ms": String(result.latencyMs) },
  );
}

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
