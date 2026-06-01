#!/usr/bin/env node

/**
 * E-06 — Smoke test CLI bin entrypoints after build.
 *
 * Usage (from repo root, after `pnpm build`):
 *   node scripts/bin-smoke.mjs
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const BINS = [
  { name: "next-ai-ready (meta)", path: join(ROOT, "packages", "meta", "dist", "cli.js"), args: ["help"] },
  { name: "@next-ai-ready/next", path: join(ROOT, "packages", "next", "dist", "cli-bin.js"), args: ["help"] },
];

async function main() {
  let failures = 0;
  for (const bin of BINS) {
    process.stdout.write(`[bin-smoke] ${bin.name} … `);
    try {
      const { stdout } = await execFileAsync("node", [bin.path, ...bin.args], {
        timeout: 10_000,
        env: { ...process.env, NODE_NO_WARNINGS: "1" },
      });
      if (stdout.includes("next-ai-ready") && stdout.includes("Commands:")) {
        console.log("ok");
      } else {
        console.log("FAILED (unexpected output)");
        failures++;
      }
    } catch (err) {
      console.log("FAILED");
      console.error(err instanceof Error ? err.message : err);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`[bin-smoke] ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("[bin-smoke] all bins OK");
}

main().catch((err) => {
  console.error("[bin-smoke] FATAL:", err.message);
  process.exit(1);
});
