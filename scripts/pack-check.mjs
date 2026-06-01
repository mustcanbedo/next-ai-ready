#!/usr/bin/env node

/**
 * E-05 — Dry-run `pnpm pack` for all publishable packages under packages/*.
 * Fails if any pack command exits non-zero.
 *
 * Usage (from repo root, after build):
 *   node scripts/pack-check.mjs
 */

import { readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PACKAGES_DIR = join(ROOT, "packages");

async function main() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  let failures = 0;
  for (const name of dirs) {
    const cwd = join(PACKAGES_DIR, name);
    process.stdout.write(`[pack-check] ${name} … `);
    try {
      await execFileAsync("pnpm", ["pack", "--pack-destination", "/tmp", "--silent"], {
        cwd,
        timeout: 60_000,
      });
      console.log("ok");
    } catch (err) {
      console.log("FAILED");
      console.error(err instanceof Error ? err.message : err);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`[pack-check] ${failures} package(s) failed`);
    process.exit(1);
  }
  console.log("[pack-check] all packages OK");
}

main().catch((err) => {
  console.error("[pack-check] FATAL:", err.message);
  process.exit(1);
});
