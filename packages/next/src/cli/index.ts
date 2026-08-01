import { runBuild } from "./build.js";
import { runInit } from "./init.js";
import { runMcpStdio } from "./mcp-stdio.js";
import { runDoctor } from "./doctor.js";
import { runDev } from "./dev.js";
import { runAudit } from "./audit.js";
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
  audit URL   Audit a deployed page as crawlers and AI agents receive it.
              --json    Emit a machine-readable JSON report.
              --version 2
                        Enable dimension-scored Audit v2 (default: v1).
  mcp         Start an MCP server over stdio (for Claude Desktop, Cursor, etc.).
  help        Show this help.

Examples:
  npx next-ai-ready init
  npx next-ai-ready build
  npx next-ai-ready dev
  npx next-ai-ready doctor --score
  npx next-ai-ready audit https://example.com/about
  npx next-ai-ready audit https://example.com/about --version 2
  npx next-ai-ready mcp
`;

interface ParsedAuditArgs {
  target: string;
  version: "1" | "2";
}

function parseAuditArgs(args: string[]): ParsedAuditArgs {
  let target = "";
  let version: "1" | "2" = "1";
  let sawVersion = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]!;
    let versionValue: string | undefined;

    if (value === "--version") {
      versionValue = args[index + 1];
      if (!versionValue || versionValue.startsWith("--")) {
        throw new AiReadyError("missing_audit_version", "The audit --version option requires a value.", [
          "Use --version 1 or --version 2.",
        ]);
      }
      index += 1;
    } else if (value.startsWith("--version=")) {
      versionValue = value.slice("--version=".length);
      if (!versionValue) {
        throw new AiReadyError("missing_audit_version", "The audit --version option requires a value.", [
          "Use --version=1 or --version=2.",
        ]);
      }
    } else if (!value.startsWith("--") && !target) {
      target = value;
    }

    if (versionValue !== undefined) {
      if (sawVersion) {
        throw new AiReadyError("duplicate_audit_version", "The audit version was provided more than once.", [
          "Pass exactly one --version option.",
        ]);
      }
      if (versionValue !== "1" && versionValue !== "2") {
        throw new AiReadyError("invalid_audit_version", `Unsupported audit version "${versionValue}".`, [
          "Use --version 1 or --version 2.",
        ]);
      }
      version = versionValue;
      sawVersion = true;
    }
  }

  return { target, version };
}

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

      case "audit": {
        const { target, version } = parseAuditArgs(rest);
        const wantJson = flags.has("--json");
        const result = version === "2" ? await runAudit(target, { version: "2" }) : await runAudit(target);

        if (wantJson) {
          process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        } else {
          if (result.version === "2") {
            for (const dimension of result.dimensions) {
              const icon = dimension.status === "fail" ? "✗" : dimension.status === "warn" ? "!" : "✓";
              process.stdout.write(
                `  ${icon} ${dimension.name}: ${dimension.score}/100 (weight ${dimension.weight}%)\n`,
              );
            }
          }
          for (const check of result.checks) {
            const icon = check.status === "fail" ? "✗" : check.status === "warn" ? "!" : "✓";
            const stream = check.status === "fail" ? process.stderr : process.stdout;
            stream.write(`  ${icon} ${check.name}: ${check.message}\n`);
            if ("recommendation" in check && check.recommendation) {
              stream.write(`    Fix: ${check.recommendation}\n`);
            }
          }
          console.log(
            `[next-ai-ready] audit${result.version === "2" ? " v2" : ""}: score ${result.score}/100 — ${result.errors} error(s), ${result.warnings} warning(s), ${result.passed} passed`,
          );
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
export {
  AUDIT_V2_SCHEMA,
  runAudit,
  type AuditCheck,
  type AuditDimensionId,
  type AuditDimensionResult,
  type AuditOptions,
  type AuditResult,
  type AuditV2Check,
  type AuditV2Options,
  type AuditV2Result,
} from "./audit.js";

export async function main(): Promise<void> {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}
