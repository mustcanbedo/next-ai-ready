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

  // A prepared release changes only generated manifests and changelogs. Compare
  // from HEAD in that state so Changesets does not flag its own version output.
  const { stdout: changedPackageFiles } = await execFileAsync(
    "git",
    ["diff", "--name-only", "HEAD", "--", "packages"],
    { cwd: ROOT, timeout: 30_000 },
  );
  const packageChanges = changedPackageFiles.trim().split("\n").filter(Boolean);
  const isPreparedRelease =
    packageChanges.length > 0 &&
    packageChanges.every((file) => /^packages\/[^/]+\/(package\.json|CHANGELOG\.md)$/.test(file));
  // Invoke the CLI binary directly — `pnpm changeset` pollutes stdout.
  // Changesets always includes uncommitted files, even with `--since HEAD`, so
  // its status command cannot inspect generated release output meaningfully.
  if (!isPreparedRelease) {
    await execFileAsync(CHANGESET_BIN, ["status"], { cwd: ROOT, timeout: 30_000 });
  }

  const files = await readdir(join(ROOT, ".changeset"));
  const pending = files.filter((f) => f.endsWith(".md") && f !== "README.md").length;
  console.log(`[changeset] config OK — ${pending} pending changeset file(s)`);
  if (isPreparedRelease) console.log("[changeset] prepared release output detected");
  console.log("[changeset] stable release path: pnpm changeset → pnpm version:packages → pnpm release");
}

main().catch((err) => {
  console.error("[changeset] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
