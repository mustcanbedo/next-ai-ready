import { timingSafeEqual } from "node:crypto";

/**
 * Production MCP auth gate (R-01). Returns a denial `Response` or `undefined` when allowed.
 * Extracted for unit testing (X-07).
 */
export async function mcpAuthGate(req: Request): Promise<Response | undefined> {
  if (process.env.NODE_ENV !== "production") return undefined;

  const token = process.env.NEXT_AI_READY_MCP_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({
        error:
          "NEXT_AI_READY_MCP_TOKEN is not set. Set it in your environment to enable the MCP endpoint in production.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Provide a valid Authorization: Bearer <token> header." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const bearer = match[1];
  if (!bearer) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Provide a valid Authorization: Bearer <token> header." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const provided = Buffer.from(bearer);
  const expected = Buffer.from(token);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Provide a valid Authorization: Bearer <token> header." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  return undefined;
}
