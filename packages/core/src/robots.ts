import { AI_BOTS } from "./bots.js";
import type { RobotsConfig, SiteInfo } from "./types.js";

/**
 * Build a `robots.txt` that is explicit about AI crawlers.
 *
 * Most sites' default `robots.txt` predates the AI era and either says nothing
 * about AI bots (ambiguous) or blocks them via an over-broad `User-agent: *`.
 * Since the entire premise of this framework is "be readable by AI", we emit
 * an explicit, auditable policy: every known AI crawler gets its own
 * `User-agent` block with an `Allow: /` (or `Disallow: /` if the user opts
 * out). We also surface the AI artifacts (`/llms.txt`, `/llms-full.txt`) so
 * crawlers discover them without guessing.
 *
 * Deterministic: stable bot ordering (from `AI_BOTS`), no timestamps.
 */
export function buildRobotsTxt(site: SiteInfo, config: RobotsConfig = {}): string {
  const policy = config.aiBots ?? "allow";
  const rule = policy === "allow" ? "Allow: /" : "Disallow: /";
  const lines: string[] = [];

  // A baseline for everyone else: allow all (we don't impose generic SEO
  // policy — that's the site owner's call).
  lines.push("User-agent: *", "Allow: /", "");

  // Explicit per-AI-bot blocks so the policy is unambiguous and greppable.
  for (const bot of AI_BOTS) {
    lines.push(`User-agent: ${bot.id}`, rule, "");
  }

  // Advertise the AI ingestion entrypoints. `llms.txt` is the AI analogue of
  // a sitemap; not all crawlers read it yet, but it's cheap to point at.
  const base = site.baseUrl.replace(/\/+$/, "");
  lines.push(`# AI ingestion entrypoints`);
  lines.push(`# ${base}/llms.txt`);
  lines.push(`# ${base}/llms-full.txt`);
  lines.push("");

  if (config.sitemap) {
    const sitemapUrl = config.sitemap === true ? `${base}/sitemap.xml` : config.sitemap;
    lines.push(`Sitemap: ${sitemapUrl}`);
  }

  if (config.extra?.length) {
    lines.push(...config.extra);
  }

  // Single trailing newline, no duplicate blank lines at the very end.
  return lines.join("\n").replace(/\n+$/, "") + "\n";
}
