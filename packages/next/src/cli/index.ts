import { runBuild } from "./build.js";
import { runInit } from "./init.js";
import { runMcpStdio } from "./mcp-stdio.js";
import { runDoctor } from "./doctor.js";
import { runDev } from "./dev.js";
import { AiReadyError, formatCliError } from "./errors.js";

const HELP = `next-ai-ready — AEO + Agent-API layer for Next.js

Usage:
  next-ai-ready <command> [options]

Commands:
  build       Scan content, compile graph, emit llms.txt and graph.json.
  dev         Watch content globs and rebuild artifacts on change.
  init        Write handler stubs into app/ and ai-ready.config.
  doctor      Validate config, action exposure, and route wiring (CI-friendly).
              --score   Include AI-readiness score (0–100).
              --json    Emit machine-readable JSON report (includes 24 tactics).
  mcp         Start an MCP server over stdio (for Claude Desktop, Cursor, etc.).
  help        Show this help.

Examples:
  npx next-ai-ready init
  npx next-ai-ready build
  npx next-ai-ready dev
  npx next-ai-ready doctor --score
  npx next-ai-ready mcp
`;

/**
 * CLI dispatcher. Kept tiny and dependency-free; `commander`/`yargs` would
 * be overkill given we have <5 subcommands.
 */
export async function runCli(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const flags = new Set(rest.filter((s) => s.startsWith("--")));

  try {
    switch (cmd) {
      case undefined:
      case "help":
      case "--help":
      case "-h":
        process.stdout.write(HELP);
        return 0;

      case "build": {
        const result = await runBuild({ silent: flags.has("--silent") });
        console.log(
          `[next-ai-ready] ✓ build complete — ${result.routes} routes, ${result.actions} actions, ${result.filesWritten.length} files written`,
        );
        return 0;
      }

      case "dev": {
        await runDev({ silent: flags.has("--silent") });
        return 0;
      }

      case "init": {
        await runInit({ force: flags.has("--force") });
        console.log("[next-ai-ready] ✓ init complete");
        return 0;
      }

      case "doctor": {
        const wantScore = flags.has("--score") || flags.has("--json");
        const wantJson = flags.has("--json");
        const result = await runDoctor({ score: wantScore, json: wantJson });

        if (wantJson && result.report) {
          process.stdout.write(JSON.stringify(result.report, null, 2) + "\n");
        } else {
          for (const d of result.diagnostics) {
            const icon = d.level === "error" ? "✗" : d.level === "warn" ? "!" : "✓";
            const stream = d.level === "error" ? process.stderr : process.stdout;
            stream.write(`  ${icon} ${d.message}\n`);
          }
          const scoreStr = result.score !== undefined ? ` — score ${result.score}/100` : "";
          console.log(
            `[next-ai-ready] doctor: ${result.errors} error(s), ${result.warnings} warning(s)${scoreStr}`,
          );
          if (result.actionItems?.length) {
            console.log("[next-ai-ready] Top fixes to improve score:");
            for (const item of result.actionItems) {
              console.log(`  → ${item}`);
            }
          }
        }
        return result.errors > 0 ? 1 : 0;
      }

      case "mcp": {
        // Blocks until the client disconnects. All logging goes to stderr so
        // stdout stays a clean JSON-RPC channel.
        await runMcpStdio({ noResources: flags.has("--no-resources") });
        return 0;
      }

      default:
        process.stderr.write(`[next-ai-ready] Unknown command: ${cmd}\n${HELP}`);
        return 2;
    }
  } catch (err) {
    process.stderr.write(formatCliError(err) + "\n");
    return err instanceof AiReadyError ? 1 : 1;
  }
}

/** Entry point used by the bin shim. */
export { AiReadyError, formatCliError } from "./errors.js";

export async function main(): Promise<void> {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}
