/**
 * Structured CLI errors with actionable fix hints (R-08).
 */
export class AiReadyError extends Error {
  readonly code: string;
  readonly actionItems: readonly string[];

  constructor(code: string, message: string, actionItems: string[] = []) {
    super(message);
    this.name = "AiReadyError";
    this.code = code;
    this.actionItems = actionItems;
  }
}

export function formatCliError(err: unknown): string {
  if (err instanceof AiReadyError) {
    const lines = [`[next-ai-ready] ${err.code}: ${err.message}`];
    for (const item of err.actionItems) {
      lines.push(`  → ${item}`);
    }
    return lines.join("\n");
  }
  return `[next-ai-ready] error: ${err instanceof Error ? err.message : String(err)}`;
}
