/**
 * Known AI crawlers and assistants. Used by analytics hooks to identify
 * which AI consumer fetched an artifact.
 *
 * Keep this list ordered roughly by prevalence so the first-match loop
 * terminates fast in production.
 */
export const AI_BOTS: { id: string; pattern: RegExp }[] = [
  { id: "GPTBot", pattern: /GPTBot/i },
  { id: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { id: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { id: "PerplexityBot", pattern: /PerplexityBot/i },
  { id: "Perplexity-User", pattern: /Perplexity-User/i },
  { id: "ClaudeBot", pattern: /ClaudeBot/i },
  { id: "Claude-Web", pattern: /Claude-Web/i },
  { id: "anthropic-ai", pattern: /anthropic-ai/i },
  { id: "Google-Extended", pattern: /Google-Extended/i },
  { id: "GoogleOther", pattern: /GoogleOther/i },
  { id: "CCBot", pattern: /CCBot/i },
  { id: "Bytespider", pattern: /Bytespider/i },
  { id: "Applebot-Extended", pattern: /Applebot-Extended/i },
  { id: "Meta-ExternalAgent", pattern: /Meta-ExternalAgent/i },
  { id: "Amazonbot", pattern: /Amazonbot/i },
  { id: "DuckAssistBot", pattern: /DuckAssistBot/i },
  { id: "YouBot", pattern: /YouBot/i },
  { id: "cohere-ai", pattern: /cohere-ai/i },
];

/** Returns the matched bot id, or `undefined` for non-AI traffic. */
export function identifyAiBot(userAgent: string | null | undefined): string | undefined {
  if (!userAgent) return undefined;
  for (const bot of AI_BOTS) {
    if (bot.pattern.test(userAgent)) return bot.id;
  }
  return undefined;
}
