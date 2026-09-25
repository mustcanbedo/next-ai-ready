/**
 * Known AI crawlers and assistants. Used by analytics hooks to identify
 * which AI consumer fetched an artifact.
 *
 * Keep provider families close together and put their most specific user
 * agents first so first-match detection remains deterministic.
 */
export type AiBotPurpose = "search" | "training" | "user" | "other";

export interface AiBotDefinition {
  id: string;
  pattern: RegExp;
  /** The access decision this bot represents, not a claim about every downstream use. */
  purpose: AiBotPurpose;
}

export const AI_BOTS: AiBotDefinition[] = [
  { id: "OAI-SearchBot", pattern: /OAI-SearchBot/i, purpose: "search" },
  { id: "GPTBot", pattern: /GPTBot/i, purpose: "training" },
  { id: "ChatGPT-User", pattern: /ChatGPT-User/i, purpose: "user" },
  { id: "Claude-SearchBot", pattern: /Claude-SearchBot/i, purpose: "search" },
  { id: "ClaudeBot", pattern: /ClaudeBot/i, purpose: "training" },
  { id: "Claude-User", pattern: /Claude-User/i, purpose: "user" },
  { id: "PerplexityBot", pattern: /PerplexityBot/i, purpose: "search" },
  { id: "Perplexity-User", pattern: /Perplexity-User/i, purpose: "user" },
  { id: "DuckAssistBot", pattern: /DuckAssistBot/i, purpose: "search" },
  { id: "YouBot", pattern: /YouBot/i, purpose: "search" },
  { id: "Claude-Web", pattern: /Claude-Web/i, purpose: "other" },
  { id: "anthropic-ai", pattern: /anthropic-ai/i, purpose: "other" },
  { id: "Google-Extended", pattern: /Google-Extended/i, purpose: "training" },
  { id: "GoogleOther", pattern: /GoogleOther/i, purpose: "other" },
  { id: "CCBot", pattern: /CCBot/i, purpose: "other" },
  { id: "Bytespider", pattern: /Bytespider/i, purpose: "training" },
  { id: "Applebot-Extended", pattern: /Applebot-Extended/i, purpose: "training" },
  { id: "Meta-ExternalAgent", pattern: /Meta-ExternalAgent/i, purpose: "other" },
  { id: "Amazonbot", pattern: /Amazonbot/i, purpose: "other" },
  { id: "cohere-ai", pattern: /cohere-ai/i, purpose: "training" },
];

/** Returns the matched bot id, or `undefined` for non-AI traffic. */
export function identifyAiBot(userAgent: string | null | undefined): string | undefined {
  if (!userAgent) return undefined;
  for (const bot of AI_BOTS) {
    if (bot.pattern.test(userAgent)) return bot.id;
  }
  return undefined;
}
