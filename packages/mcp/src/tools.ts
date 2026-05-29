import { invokeAction, listActions, schemaToJsonSchema } from "@next-ai-ready/actions";

/** MCP tool call result, in the SDK's `content` envelope. */
export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

/**
 * A transport-agnostic description of one MCP tool, derived from a public
 * action. We keep both the JSON Schema (for inspection / non-Zod clients)
 * and the raw Zod shape (which the `@modelcontextprotocol/sdk` `tool()` /
 * `registerTool()` APIs expect) so the binder in `@next-ai-ready/next` can
 * pick whichever the installed SDK version wants.
 */
export interface McpToolDefinition {
  name: string;
  /** Description with `whenToUse` / `whenNotToUse` folded in for tool selection. */
  description: string;
  /** JSON Schema 2020-12 of the input. */
  inputSchema: Record<string, unknown>;
  /** Zod raw shape (`schema.shape`) when the input is a Zod object, else `{}`. */
  inputShape: Record<string, unknown>;
  /** Execute the tool — delegates to `invokeAction` so all security rules apply. */
  execute(args: unknown, request?: Request): Promise<McpToolResult>;
}

/**
 * Build MCP tool definitions from the current action registry.
 *
 * Only `public: true` actions are exposed (ADR-010). The executor reuses
 * `invokeAction`, so the same validation + auth + error mapping that guards
 * the HTTP surface guards the MCP surface — zero duplicated security logic.
 */
export function toMcpToolDefinitions(): McpToolDefinition[] {
  return listActions()
    .filter((a) => a.public)
    .map((action) => ({
      name: action.name,
      description: foldDescription(action.description, action.whenToUse, action.whenNotToUse),
      inputSchema: schemaToJsonSchema(action.input),
      inputShape: extractShape(action.input),
      async execute(args: unknown, request?: Request): Promise<McpToolResult> {
        // stdio transport has no HTTP request; synthesize a local one so
        // `auth` hooks still receive a Request (they'll typically deny, which
        // is the safe default for unauthenticated local clients).
        const req = request ?? new Request("http://mcp.local/");
        const result = await invokeAction(action.name, args, req);
        if (result.ok) {
          return { content: [{ type: "text", text: stringify(result.data) }] };
        }
        return {
          content: [
            {
              type: "text",
              text: stringify({ error: result.code, message: result.message, details: result.details }),
            },
          ],
          isError: true,
        };
      },
    }));
}

function foldDescription(desc: string, whenToUse?: string, whenNotToUse?: string): string {
  const parts = [desc.trim()];
  if (whenToUse) parts.push(`Use when: ${whenToUse.trim()}`);
  if (whenNotToUse) parts.push(`Do not use when: ${whenNotToUse.trim()}`);
  return parts.join(" ");
}

function stringify(data: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

/**
 * Pull the Zod raw shape from an object schema. The SDK registers tools with
 * a `ZodRawShape` (a plain object of Zod types), not a full schema.
 */
function extractShape(schema: unknown): Record<string, unknown> {
  if (schema && typeof schema === "object" && "shape" in schema) {
    const shape = (schema as { shape: unknown }).shape;
    if (shape && typeof shape === "object") return shape as Record<string, unknown>;
  }
  return {};
}
