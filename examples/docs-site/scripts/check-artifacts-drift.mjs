#!/usr/bin/env node
/**
 * Fail if committed AI artifacts differ from a fresh `next-ai-ready build`.
 * Run from examples/docs-site after build:
 *
 *   node ../../packages/meta/dist/cli.js build
 *   node scripts/check-artifacts-drift.mjs
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Paths committed in this repo (`.next-ai-ready/` is gitignored — validated by smoke). */
const TRACKED = [
  "public/llms.txt",
  "public/llms-full.txt",
  "public/openapi.json",
  "public/tools.json",
  "public/.well-known/ai-plugin.json",
];

const diff = spawnSync("git", ["diff", "--exit-code", "--", ...TRACKED], {
  cwd: ROOT,
  encoding: "utf8",
});

if (diff.status === 0) {
  console.log("[check-artifacts-drift] committed artifacts match working tree");
  process.exit(0);
}

if (diff.status === 1) {
  console.error("[check-artifacts-drift] FAIL: AI artifacts out of date after build");
  console.error("Run `node ../../packages/meta/dist/cli.js build` and commit updated files:");
  console.error(TRACKED.map((p) => `  ${p}`).join("\n"));
  if (diff.stdout) console.error(diff.stdout.slice(0, 4000));
  process.exit(1);
}

console.error("[check-artifacts-drift] git diff failed:", diff.stderr || diff.error);
process.exit(2);
