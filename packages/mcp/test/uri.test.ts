import { describe, expect, it } from "vitest";
import { mcpPageUri, routeFromMcpPageUri, safeMcpPageRoute } from "../src/resources.js";

describe("MCP page URI (C-72)", () => {
  it("round-trips routes", () => {
    expect(mcpPageUri("/docs/install")).toBe("airead://page/docs/install");
    expect(mcpPageUri("/")).toBe("airead://page/index");
    expect(mcpPageUri("/index")).toBe("airead://page/%69ndex");
    expect(mcpPageUri("/中文 文档")).toBe("airead://page/%E4%B8%AD%E6%96%87%20%E6%96%87%E6%A1%A3");
    expect(routeFromMcpPageUri("airead://page/docs/install")).toBe("/docs/install");
    expect(routeFromMcpPageUri("airead://page/index")).toBe("/");
    expect(routeFromMcpPageUri("airead://page/%69ndex")).toBe("/index");
    expect(routeFromMcpPageUri("airead://page/%E4%B8%AD%E6%96%87%20%E6%96%87%E6%A1%A3")).toBe("/中文 文档");
    expect(routeFromMcpPageUri("other://x")).toBeNull();
  });

  it("rejects ambiguous and unsafe routes", () => {
    expect(safeMcpPageRoute("/docs/install")).toBe("/docs/install");
    expect(safeMcpPageRoute("docs/install")).toBeNull();
    expect(safeMcpPageRoute("/docs/../secret")).toBeNull();
    expect(safeMcpPageRoute("/docs/%2fsecret")).toBeNull();
    expect(safeMcpPageRoute("/docs?draft=1")).toBeNull();
    expect(routeFromMcpPageUri("airead://pages/docs/install")).toBeNull();
    expect(routeFromMcpPageUri("airead://page/docs/%2e%2e/secret")).toBeNull();
    expect(routeFromMcpPageUri("airead://page/docs/install#fragment")).toBeNull();
    expect(() => mcpPageUri("https://evil.example/")).toThrow(TypeError);
  });
});
