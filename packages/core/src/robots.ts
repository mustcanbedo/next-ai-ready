import { AI_BOTS } from "./bots.js";
import type { AiBotAccess, RobotsConfig, SiteInfo } from "./types.js";

/**
 * Shape compatible with Next.js `MetadataRoute.Robots`.
 *
 * Returned by {@link aiRobots} so users can drop it straight into
 * `app/robots.ts` without manual conversion:
 *
 *   // app/robots.ts
 *   import { aiRobots } from "@next-ai-ready/core/robots";
 *   export default function robots() { return aiRobots(site, config); }
 */
export interface AiRobotsRule {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
}

export interface AiRobotsResult {
  rules: AiRobotsRule[];
  sitemap?: string | string[];
  host?: string;
}

/**
 * Build a `robots.txt` that is explicit about AI crawlers.
 *
 * Most sites' default `robots.txt` predates the AI era and either says nothing
 * about AI bots (ambiguous) or blocks them via an over-broad `User-agent: *`.
 * Since the entire premise of this framework is "be readable by AI", we emit
 * an explicit, auditable policy: every known AI crawler gets its own
 * `User-agent` block. A role-aware policy can keep AI search visible while
 * opting out of training. We also leave human-readable comments pointing to
 * the AI artifacts; comments are not standardized crawler directives.
 *
 * Deterministic: stable bot ordering (from `AI_BOTS`), no timestamps.
 */
export function buildRobotsTxt(site: SiteInfo, config: RobotsConfig = {}): string {
  const lines: string[] = [];

  // A baseline for everyone else: allow all (we don't impose generic SEO
  // policy — that's the site owner's call).
  lines.push("User-agent: *", "Allow: /", "");

  // Explicit per-AI-bot blocks so the policy is unambiguous and greppable.
  for (const bot of AI_BOTS) {
    const rule = resolveBotAccess(config, bot.purpose) === "allow" ? "Allow: /" : "Disallow: /";
    lines.push(`User-agent: ${bot.id}`, rule, "");
  }

  // Human-readable pointers only. These comments do not advertise a
  // standardized robots.txt directive and do not guarantee discovery.
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

/**
 * Return an `AiRobotsResult` (Next.js `MetadataRoute.Robots`-compatible)
 * with the same AI-bot policy as {@link buildRobotsTxt}.
 *
 * Drop-in for `app/robots.ts`:
 *
 * ```ts
 * // app/robots.ts
 *   import { aiRobots } from "@next-ai-ready/core/robots";
 *   const site = { name: "Acme", baseUrl: "https://acme.com" };
 *   export default function robots() { return aiRobots(site); }
 * ```
 *
 * The policy is identical to the static `buildRobotsTxt` output: every known
 * AI crawler gets an explicit `Allow: /` (or `Disallow: /` if the user opts
 * out), plus a catch-all `User-agent: *` rule.
 */
export function aiRobots(site: SiteInfo, config: RobotsConfig = {}): AiRobotsResult {
  const rules: AiRobotsRule[] = [];

  // Catch-all baseline.
  rules.push({ userAgent: "*", allow: "/" });

  // Explicit per-AI-bot rules.
  for (const bot of AI_BOTS) {
    const aiRule = resolveBotAccess(config, bot.purpose) === "allow" ? "allow" : "disallow";
    rules.push({
      userAgent: bot.id,
      [aiRule]: "/",
    });
  }

  const base = site.baseUrl.replace(/\/+$/, "");
  const result: AiRobotsResult = { rules };

  if (config.sitemap) {
    result.sitemap = config.sitemap === true ? `${base}/sitemap.xml` : config.sitemap;
  }

  if (config.extra?.length) {
    // Extra lines are raw robots.txt directives — we can't map them to the
    // structured format. For complex extra rules, users should fall back to
    // buildRobotsTxt() which handles raw text output.
    console.warn(
      "aiRobots(): `extra` rules are not supported in the structured format. " +
        "Use buildRobotsTxt() for custom robots.txt directives.",
    );
  }

  return result;
}

function resolveBotAccess(
  config: RobotsConfig,
  purpose: (typeof AI_BOTS)[number]["purpose"],
): AiBotAccess {
  const policy = config.aiBots ?? "allow";
  if (typeof policy === "string") return policy;
  return policy[purpose] ?? policy.default ?? "allow";
}
