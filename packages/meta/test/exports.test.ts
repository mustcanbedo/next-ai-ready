import { describe, expect, it } from "vitest";

describe("next-ai-ready meta package", () => {
  it("re-exports core config helpers", async () => {
    const mod = await import("../src/index.js");
    expect(typeof mod.defineConfig).toBe("function");
  });

  it("re-exports action helpers", async () => {
    const mod = await import("../src/index.js");
    expect(typeof mod.defineAction).toBe("function");
    expect(typeof mod.defineActions).toBe("function");
  });

  it("re-exports Next integration helpers", async () => {
    const mod = await import("../src/index.js");
    expect(typeof mod.withAiReady).toBe("function");
    expect(typeof mod.registerAiHooks).toBe("function");
    expect(typeof mod.clearAiHooks).toBe("function");
  });
});
