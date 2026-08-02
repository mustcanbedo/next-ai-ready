#!/usr/bin/env node
/**
 * Docs-site smoke — validates AI artifacts and key dogfood invariants.
 *
 *   node scripts/docs-site-smoke.mjs
 */

import { readFile, access, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "../../packages/meta/dist/cli.js");
const SMOKE_MCP_TOKEN = "next-ai-ready-docs-site-smoke-token";

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

async function sourceFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.(?:mjs|ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  }));
  return files.flat();
}

async function main() {
  console.log("[docs-site-smoke] checking artifacts…");

  const packageJson = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const internalDependencies = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }).filter((name) => name.startsWith("@next-ai-ready/"));
  if (internalDependencies.length > 0) {
    fail(`docs site depends on internal packages: ${internalDependencies.join(", ")}`);
  }

  const runtimeFiles = [
    join(ROOT, "ai-ready.config.mjs"),
    join(ROOT, "next.config.mjs"),
    join(ROOT, "instrumentation-node.ts"),
    ...await sourceFiles(join(ROOT, "actions")),
    ...await sourceFiles(join(ROOT, "app")),
  ];
  for (const path of runtimeFiles) {
    const source = await readFile(path, "utf8");
    if (/from ["']@next-ai-ready\//.test(source)) {
      fail(`docs runtime imports an internal package: ${path.slice(ROOT.length + 1)}`);
    }
  }
  ok("docs site dogfoods the public meta package only");

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

  const llmsFull = await readFile(join(ROOT, "public/llms-full.txt"), "utf8");
  if (!llmsFull.includes("What is next-ai-ready?")) {
    fail("llms-full.txt missing curated FAQ content");
  }
  ok("llms-full.txt curated FAQ");

  const sitemapMd = await readFile(join(ROOT, "public/sitemap.md"), "utf8");
  if (!sitemapMd.includes("[Introduction](https://next-ai-ready.vercel.app/en/docs/introduction)")) {
    fail("sitemap.md missing canonical introduction URL");
  }
  if (!sitemapMd.includes("[next-ai-ready](https://next-ai-ready.vercel.app/en)")) {
    fail("sitemap.md missing canonical English homepage URL");
  }
  ok("sitemap.md canonical page directory");

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
    env: {
      ...process.env,
      NEXT_AI_READY_MCP_TOKEN: process.env.NEXT_AI_READY_MCP_TOKEN ?? SMOKE_MCP_TOKEN,
    },
  });
  if (doctor.status !== 0) {
    console.error(doctor.stdout);
    console.error(doctor.stderr);
    fail(`doctor exit ${doctor.status}`);
  }
  const scoreLine =
    doctor.stdout
      .split("\n")
      .find((line) => /\[next-ai-ready\] doctor:.*score \d+\/100/.test(line)) ?? "";
  console.log(`  ✓ ${scoreLine.trim()}`);
  if (!/0 error\(s\), 0 warning\(s\) — score 100\/100/.test(scoreLine)) {
    fail(`expected doctor score 100 with no warnings, got: ${scoreLine || doctor.stdout}`);
  }

  console.log("\n[docs-site-smoke] ALL CHECKS PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
