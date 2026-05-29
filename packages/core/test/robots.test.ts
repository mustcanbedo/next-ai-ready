import { describe, expect, it } from "vitest";
import { buildRobotsTxt } from "../src/robots.js";
import { AI_BOTS } from "../src/bots.js";

const SITE = { name: "Acme", baseUrl: "https://acme.com" };

describe("buildRobotsTxt()", () => {
  it("allows AI bots by default with explicit per-bot blocks", () => {
    const txt = buildRobotsTxt(SITE);
    // Every known AI bot gets its own User-agent block.
    for (const bot of AI_BOTS) {
      expect(txt).toContain(`User-agent: ${bot.id}`);
    }
    expect(txt).toContain("User-agent: GPTBot\nAllow: /");
    expect(txt).toContain("User-agent: *\nAllow: /");
    // Advertises AI ingestion entrypoints.
    expect(txt).toContain("https://acme.com/llms.txt");
    expect(txt).toContain("https://acme.com/llms-full.txt");
    // Ends with a single trailing newline.
    expect(txt.endsWith("\n")).toBe(true);
    expect(txt.endsWith("\n\n")).toBe(false);
  });

  it("disallows AI bots when aiBots = 'disallow'", () => {
    const txt = buildRobotsTxt(SITE, { aiBots: "disallow" });
    expect(txt).toContain("User-agent: GPTBot\nDisallow: /");
    expect(txt).toContain("User-agent: ClaudeBot\nDisallow: /");
    // Non-AI default stays allow.
    expect(txt).toContain("User-agent: *\nAllow: /");
  });

  it("emits a Sitemap line when configured", () => {
    expect(buildRobotsTxt(SITE, { sitemap: true })).toContain("Sitemap: https://acme.com/sitemap.xml");
    expect(buildRobotsTxt(SITE, { sitemap: "https://cdn.acme.com/sm.xml" })).toContain(
      "Sitemap: https://cdn.acme.com/sm.xml",
    );
    expect(buildRobotsTxt(SITE)).not.toContain("Sitemap:");
  });

  it("appends extra raw lines and strips trailing baseUrl slash", () => {
    const txt = buildRobotsTxt(
      { name: "Acme", baseUrl: "https://acme.com/" },
      { extra: ["Disallow: /admin"] },
    );
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("https://acme.com/llms.txt"); // no double slash
  });

  it("is deterministic", () => {
    expect(buildRobotsTxt(SITE)).toBe(buildRobotsTxt(SITE));
  });
});
