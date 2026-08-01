/* global process */

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = resolve(ROOT, "scripts/public-api-check.mjs");
const BASELINE = resolve(ROOT, "scripts/public-api-baseline.json");

function runCheck(env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("accepts the committed 0.1 public API baseline", () => {
  const result = runCheck();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /10 package contracts match the 0\.1 baseline/);
});

test("rejects named export drift", async () => {
  const dir = await mkdtemp(resolve(tmpdir(), "next-ai-ready-api-check-"));
  try {
    const baseline = JSON.parse(await readFile(BASELINE, "utf8"));
    baseline.packages["@next-ai-ready/actions"].entrypoints["."].pop();
    const changedBaseline = resolve(dir, "baseline.json");
    await writeFile(changedBaseline, JSON.stringify(baseline, null, 2));

    const result = runCheck({ NEXT_AI_READY_API_BASELINE: changedBaseline });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /named exports changed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
