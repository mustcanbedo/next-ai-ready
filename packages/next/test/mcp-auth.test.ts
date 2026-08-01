import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mcpAuthGate } from "../src/handlers/mcp-auth.js";

describe("mcpAuthGate (X-07)", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "production", NEXT_AI_READY_MCP_TOKEN: "secret-token" };
  });

  afterEach(() => {
    process.env = env;
  });

  it("allows requests in development without a token", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.NEXT_AI_READY_MCP_TOKEN;
    await expect(mcpAuthGate(new Request("http://localhost/api/mcp"))).resolves.toBeUndefined();
  });

  it("keeps the production endpoint unavailable when token env is missing", async () => {
    delete process.env.NEXT_AI_READY_MCP_TOKEN;
    const res = await mcpAuthGate(new Request("http://localhost/api/mcp"));
    expect(res?.status).toBe(503);
    await expect(res?.json()).resolves.toMatchObject({
      error: expect.stringContaining("NEXT_AI_READY_MCP_TOKEN is not set"),
    });
  });

  it("rejects invalid bearer token", async () => {
    const res = await mcpAuthGate(
      new Request("http://localhost/api/mcp", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    expect(res?.status).toBe(401);
  });

  it("allows valid bearer token", async () => {
    const res = await mcpAuthGate(
      new Request("http://localhost/api/mcp", {
        headers: { authorization: "Bearer secret-token" },
      }),
    );
    expect(res).toBeUndefined();
  });
});
