#!/usr/bin/env node

/**
 * E-04 — Verify changeset tooling is wired (no version bump).
 *
 * Run from repo root:
 *   node scripts/changeset-status.mjs
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CHANGESET_BIN = join(ROOT, "node_modules", ".bin", "changeset");

async function main() {
  const configPath = join(ROOT, ".changeset", "config.json");
  await access(configPath);
  await access(CHANGESET_BIN);

  // Invoke the CLI binary directly — `pnpm changeset` pollutes stdout.
  await execFileAsync(CHANGESET_BIN, ["status"], { cwd: ROOT, timeout: 30_000 });

  const files = await readdir(join(ROOT, ".changeset"));
  const pending = files.filter((f) => f.endsWith(".md") && f !== "README.md").length;
  console.log(`[changeset] config OK — ${pending} pending changeset file(s)`);
  console.log("[changeset] stable release path: pnpm changeset → pnpm version → pnpm release");
}

main().catch((err) => {
  console.error("[changeset] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
