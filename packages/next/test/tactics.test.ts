import { describe, expect, it } from "vitest";
import { evaluateTactics, tacticsScore } from "../src/cli/tactics.js";

describe("evaluateTactics()", () => {
  it("returns 24 tactic results from goals.md", async () => {
    const results = await evaluateTactics({
      cwd: process.cwd(),
      config: null,
      graphRaw: null,
    });
    expect(results).toHaveLength(24);
    expect(results.filter((r) => r.plane === "K")).toHaveLength(12);
    expect(results.filter((r) => r.plane === "C")).toHaveLength(12);
    expect(tacticsScore(results)).toBeGreaterThanOrEqual(0);
    expect(tacticsScore(results)).toBeLessThanOrEqual(100);
  });
});
