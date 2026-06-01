import { describe, expect, it } from "vitest";
import { mcpPageUri, routeFromMcpPageUri } from "../src/resources.js";

describe("MCP page URI (C-72)", () => {
  it("round-trips routes", () => {
    expect(mcpPageUri("/docs/install")).toBe("airead://page/docs/install");
    expect(mcpPageUri("/")).toBe("airead://page/index");
    expect(routeFromMcpPageUri("airead://page/docs/install")).toBe("/docs/install");
    expect(routeFromMcpPageUri("airead://page/index")).toBe("/");
    expect(routeFromMcpPageUri("other://x")).toBeNull();
  });
});
