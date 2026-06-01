import { describe, expect, it } from "vitest";
import { AiReadyError, formatCliError } from "../src/cli/errors.js";

describe("AiReadyError (R-08)", () => {
  it("formats code, message, and action items", () => {
    const err = new AiReadyError("missing_jiti", "jiti is not installed.", [
      "Run npm install jiti",
      "Or use ai-ready.config.mjs",
    ]);
    const out = formatCliError(err);
    expect(out).toContain("missing_jiti");
    expect(out).toContain("jiti is not installed");
    expect(out).toContain("→ Run npm install jiti");
  });

  it("falls back for generic errors", () => {
    expect(formatCliError(new Error("boom"))).toContain("boom");
  });
});
