/* global process */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(ROOT, "scripts/release-rollback-plan.mjs");

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

test("prints a reviewable npm rollback plan without executing it", () => {
  const result = run([
    "--package", "next-ai-ready",
    "--bad", "0.1.0",
    "--good", "0.1.0-alpha.12",
    "--tag", "latest",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npm deprecate 'next-ai-ready@0\.1\.0'/);
  assert.match(result.stdout, /npm dist-tag add 'next-ai-ready@0\.1\.0-alpha\.12' latest/);
});

test("rejects unknown packages and non-exact versions", () => {
  const unknown = run(["--package", "other-package", "--bad", "0.1.0", "--good", "0.1.1"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown publishable package/);

  const range = run(["--package", "next-ai-ready", "--bad", "^0.1.0", "--good", "0.1.1"]);
  assert.equal(range.status, 1);
  assert.match(range.stderr, /exact SemVer versions/);

  const semverTag = run([
    "--package", "next-ai-ready",
    "--bad", "0.1.0",
    "--good", "0.1.1",
    "--tag", "0.1.1",
  ]);
  assert.equal(semverTag.status, 1);
  assert.match(semverTag.stderr, /valid npm dist-tag/);
});
