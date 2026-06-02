#!/usr/bin/env node
/**
 * Docs-site smoke — validates AI artifacts and key dogfood invariants.
 *
 *   node scripts/docs-site-smoke.mjs
 */

import { readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "../../packages/meta/dist/cli.js");

async function mustExist(rel) {
  const p = join(ROOT, rel);
  await access(p);
  return p;
}

function fail(msg) {
  console.error(`[docs-site-smoke] FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("[docs-site-smoke] checking artifacts…");

  await mustExist(".next-ai-ready/graph.json");
  ok("graph.json exists");

  const llms = await readFile(join(ROOT, "public/llms.txt"), "utf8");
  if (!llms.includes("next-ai-ready.vercel.app/en/docs/introduction")) {
    fail("llms.txt missing curated introduction URL");
  }
  if (!llms.includes("## Introduction")) fail("llms.txt missing Introduction section");
  if (llms.includes("next-ai-ready.dev")) fail("llms.txt still references next-ai-ready.dev");
  ok("llms.txt URLs and sections");

  const graph = JSON.parse(
    await readFile(join(ROOT, ".next-ai-ready/graph.json"), "utf8"),
  );
  const intro = Object.values(graph.nodes).find(
    (n) => n.route === "/en/docs/introduction" && n.kind === "page",
  );
  if (!intro?.questions?.some((q) => q.q === "What is next-ai-ready?")) {
    fail("graph.json missing curated FAQ on /en/docs/introduction");
  }
  ok("graph.json curated FAQ");

  const openapi = await readFile(join(ROOT, "public/openapi.json"), "utf8");
  if (openapi.includes("/en/introduction'") || openapi.includes('/en/introduction"')) {
    fail("openapi.json still uses stale /en/introduction route example");
  }
  if (!openapi.includes("/en/docs/introduction")) {
    fail("openapi.json missing /en/docs/introduction route hint");
  }
  ok("openapi.json route hints");

  await mustExist("public/icon.svg");
  ok("icon.svg exists");

  const doctor = spawnSync("node", [CLI, "doctor", "--score"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (doctor.status !== 0) {
    console.error(doctor.stdout);
    console.error(doctor.stderr);
    fail(`doctor exit ${doctor.status}`);
  }
  const scoreLine = doctor.stdout.trim().split("\n").pop() ?? "";
  console.log(`  ✓ ${scoreLine}`);
  if (!/score 9[0-9]\/100|score 100\/100/.test(scoreLine)) {
    fail(`expected doctor score ≥ 90, got: ${scoreLine}`);
  }

  console.log("\n[docs-site-smoke] ALL CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
