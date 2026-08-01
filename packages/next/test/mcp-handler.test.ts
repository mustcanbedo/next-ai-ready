import { describe, expect, it, vi } from "vitest";
import { createAiReadyMcpHandler } from "../src/handlers/mcp.js";

vi.mock("server-only", () => ({}));

const initializeRequest = (pathname: string) =>
  new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "next-ai-ready-test", version: "1.0.0" },
      },
    }),
  });

describe("createAiReadyMcpHandler", () => {
  it("mounts the generated transport route at /api/mcp by default", async () => {
    const handler = await createAiReadyMcpHandler({ auth: false, resources: false });
    const response = await handler(initializeRequest("/api/mcp/mcp"));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"protocolVersion":"2025-03-26"');
  });

  it("honors a custom transport base path", async () => {
    const handler = await createAiReadyMcpHandler({
      auth: false,
      resources: false,
      basePath: "/custom/mcp",
    });
    const response = await handler(initializeRequest("/custom/mcp/mcp"));

    expect(response.status).toBe(200);
  });
});
