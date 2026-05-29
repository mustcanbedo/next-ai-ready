import { describe, expect, it } from "vitest";
import { withAiReady } from "../src/with-ai-ready.js";

describe("withAiReady()", () => {
  it("adds rewrites and file tracing by default", () => {
    const config = withAiReady()({} as Record<string, unknown>);
    expect(typeof config.rewrites).toBe("function");
    expect(config.outputFileTracingIncludes).toBeDefined();
  });

  it("rewrites returns our AI routes when user has no prior rewrites", async () => {
    const config = withAiReady()({} as Record<string, unknown>);
    const rewrites = await (config.rewrites as () => Promise<unknown>)();
    expect(Array.isArray(rewrites)).toBe(true);
    const sources = (rewrites as Array<{ source: string }>).map((r) => r.source);
    expect(sources).toContain("/llms.txt");
    expect(sources).toContain("/:path*.md");
    expect(sources).toContain("/api/openapi.json");
  });

  it("merges with flat-array user rewrites", async () => {
    const userRewrites = [{ source: "/old", destination: "/new" }];
    const config = withAiReady()({
      rewrites: async () => userRewrites,
    });
    const result = await (config.rewrites as () => Promise<unknown>)();
    expect(Array.isArray(result)).toBe(true);
    const arr = result as Array<{ source: string }>;
    expect(arr[0].source).toBe("/old");
    expect(arr.some((r) => r.source === "/llms.txt")).toBe(true);
  });

  it("merges with object-form user rewrites (beforeFiles/afterFiles/fallback)", async () => {
    const config = withAiReady()({
      rewrites: async () => ({
        beforeFiles: [{ source: "/pre", destination: "/pre-dest" }],
        afterFiles: [{ source: "/post", destination: "/post-dest" }],
        fallback: [{ source: "/fb", destination: "/fb-dest" }],
      }),
    });
    const result = await (config.rewrites as () => Promise<unknown>)();
    expect(Array.isArray(result)).toBe(false);
    const obj = result as {
      beforeFiles: Array<{ source: string }>;
      afterFiles: Array<{ source: string }>;
      fallback: Array<{ source: string }>;
    };
    // Our rewrites go into beforeFiles
    expect(obj.beforeFiles.some((r) => r.source === "/llms.txt")).toBe(true);
    expect(obj.beforeFiles.some((r) => r.source === "/pre")).toBe(true);
    // User's afterFiles/fallback preserved
    expect(obj.afterFiles[0].source).toBe("/post");
    expect(obj.fallback[0].source).toBe("/fb");
  });

  it("skips rewrites when opts.rewrites = false", () => {
    const config = withAiReady({ rewrites: false })({} as Record<string, unknown>);
    expect(config.rewrites).toBeUndefined();
  });

  it("skips file tracing when opts.fileTracing = false", () => {
    const config = withAiReady({ fileTracing: false })({} as Record<string, unknown>);
    expect(config.outputFileTracingIncludes).toBeUndefined();
  });
});
