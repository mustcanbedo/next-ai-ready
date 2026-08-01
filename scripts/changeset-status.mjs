#!/usr/bin/env node

/**
 * E-04 — Verify changeset tooling is wired (no version bump).
 *
 * Run from repo root:
 *   node scripts/changeset-status.mjs
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CHANGESET_BIN = join(ROOT, "node_modules", ".bin", "changeset");

async function main() {
  const configPath = join(ROOT, ".changeset", "config.json");
  const prePath = join(ROOT, ".changeset", "pre.json");
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
    packageChanges.every(isGeneratedPackageReleaseFile);
  const { stdout: headFilesOutput } = await execFileAsync(
    "git",
    ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"],
    { cwd: ROOT, timeout: 30_000 },
  );
  const headFiles = headFilesOutput.trim().split("\n").filter(Boolean);
  const isCommittedPreparedRelease = isPreparedReleaseCommit({
    packageChanges,
    headFiles,
    prereleaseConsumed: await hasConsumedPrereleaseChangesets(prePath),
  });
  // Invoke the CLI binary directly — `pnpm changeset` pollutes stdout.
  // Changesets always includes uncommitted files, even with `--since HEAD`, so
  // its status command cannot inspect generated release output meaningfully.
  if (!isPreparedRelease && !isCommittedPreparedRelease) {
    await execFileAsync(CHANGESET_BIN, ["status"], { cwd: ROOT, timeout: 30_000 });
  }

  const files = await readdir(join(ROOT, ".changeset"));
  const pending = files.filter((f) => f.endsWith(".md") && f !== "README.md").length;
  console.log(`[changeset] config OK — ${pending} pending changeset file(s)`);
  if (isPreparedRelease || isCommittedPreparedRelease) {
    console.log(
      `[changeset] prepared release output detected${isCommittedPreparedRelease ? " (committed)" : ""}`,
    );
  }
  console.log("[changeset] stable release path: pnpm changeset → pnpm version:packages → pnpm release");
}

async function hasConsumedPrereleaseChangesets(prePath) {
  try {
    const pre = JSON.parse(await readFile(prePath, "utf8"));
    return pre?.mode === "pre" && Array.isArray(pre.changesets) && pre.changesets.length > 0;
  } catch {
    return false;
  }
}

function isGeneratedPackageReleaseFile(file) {
  return /^packages\/[^/]+\/(package\.json|CHANGELOG\.md)$/.test(file);
}

export function isPreparedReleaseCommit({ packageChanges, headFiles, prereleaseConsumed }) {
  const packageJsonPackages = new Set(
    headFiles
      .map((file) => file.match(/^packages\/([^/]+)\/package\.json$/)?.[1])
      .filter(Boolean),
  );
  const changelogPackages = new Set(
    headFiles
      .map((file) => file.match(/^packages\/([^/]+)\/CHANGELOG\.md$/)?.[1])
      .filter(Boolean),
  );
  return (
    packageChanges.length === 0 &&
    prereleaseConsumed &&
    headFiles.includes(".changeset/pre.json") &&
    packageJsonPackages.size > 0 &&
    packageJsonPackages.size === changelogPackages.size &&
    [...packageJsonPackages].every((name) => changelogPackages.has(name)) &&
    headFiles.length > 0 &&
    headFiles.every((file) => file === ".changeset/pre.json" || isGeneratedPackageReleaseFile(file))
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("[changeset] FAILED:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
