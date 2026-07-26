#!/usr/bin/env node

/**
 * E2E smoke test — simulates what a user does outside the monorepo:
 *
 *   1. Create a temp directory with a minimal Next.js project
 *   2. Run `next-ai-ready init` (scaffolds handler stubs + patches config/scripts)
 *   3. Run `next-ai-ready build` (generates graph + llms.txt + openapi.json)
 *   4. Verify expected artifacts exist
 *   5. Clean up
 *
 * Run from repo root after `pnpm build`:
 *   node scripts/e2e-smoke.mjs
 */

import { mkdtemp, writeFile, readFile, rm, access, mkdir } from "node:fs/promises";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLI = join(ROOT, "packages", "meta", "dist", "cli.js");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function run(cwd, args) {
  const { stdout, stderr } = await execFileAsync("node", [CLI, ...args], {
    cwd,
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
    timeout: 30_000,
  });
  return { stdout, stderr };
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "nair-e2e-"));
  console.log(`[e2e] temp project: ${dir}`);

  try {
    // 1. Set up minimal project with workspace links to monorepo packages
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "e2e-smoke",
          version: "0.0.0",
          private: true,
          packageManager: "pnpm@9.12.0",
          scripts: { build: "next build" },
          dependencies: {
            "zod": "^4.4.3",
            "next-ai-ready": `link:${join(ROOT, "packages", "meta")}`,
            "@next-ai-ready/core": `link:${join(ROOT, "packages", "core")}`,
            "@next-ai-ready/next": `link:${join(ROOT, "packages", "next")}`,
            "@next-ai-ready/actions": `link:${join(ROOT, "packages", "actions")}`,
            "@next-ai-ready/semantic": `link:${join(ROOT, "packages", "semantic")}`,
            "@next-ai-ready/mdx": `link:${join(ROOT, "packages", "mdx")}`,
            "@next-ai-ready/llms": `link:${join(ROOT, "packages", "llms")}`,
            "@next-ai-ready/openapi": `link:${join(ROOT, "packages", "openapi")}`,
            "@next-ai-ready/mcp": `link:${join(ROOT, "packages", "mcp")}`,
          },
        },
        null,
        2,
      ) + "\n",
    );

    await mkdir(join(dir, "content"), { recursive: true });
    await writeFile(
      join(dir, "content", "index.mdx"),
      `---
title: Home
description: E2E smoke test page.
---

# Hello World

This is a test page for the e2e smoke test.
`,
    );

    // 2. Install (creates symlinks to monorepo packages)
    console.log("[e2e] installing...");
    await execFileAsync("pnpm", ["install", "--no-frozen-lockfile"], {
      cwd: dir,
      timeout: 30_000,
    });

    // 3. Run init
    console.log("[e2e] running init...");
    const initResult = await run(dir, ["init"]);
    console.log(initResult.stdout.trim());

    // 4. Run build
    console.log("[e2e] running build...");
    const buildResult = await run(dir, ["build"]);
    console.log(buildResult.stdout.trim());

    // 5. Verify artifacts
    const required = [
      ".next-ai-ready/graph.json",
      "public/llms.txt",
      "public/sitemap.md",
      "public/robots.txt",
      "public/openapi.json",
      "public/tools.json",
      "public/.well-known/ai-plugin.json",
      // Handler stubs
      "app/%5Fai-ready/llms-txt/route.ts",
      "app/%5Fai-ready/openapi/route.ts",
      "app/api/actions/[name]/route.ts",
      // Config patched
      "next.config.mjs",
    ];

    let failures = 0;
    for (const rel of required) {
      const p = join(dir, rel);
      if (await exists(p)) {
        console.log(`  ✓ ${rel}`);
      } else {
        console.error(`  ✗ MISSING: ${rel}`);
        failures++;
      }
    }

    // Verify ai-plugin.json points to /openapi.json
    const pluginRaw = await readFile(join(dir, "public/.well-known/ai-plugin.json"), "utf8");
    const plugin = JSON.parse(pluginRaw);
    if (plugin.api?.url?.includes("/openapi.json") && !plugin.api.url.includes("/api/openapi.json")) {
      console.log("  ✓ ai-plugin.json → /openapi.json (canonical)");
    } else {
      console.error(`  ✗ ai-plugin.json url unexpected: ${plugin.api?.url}`);
      failures++;
    }

    // Verify next.config.mjs has withAiReady
    const config = await readFile(join(dir, "next.config.mjs"), "utf8");
    if (config.includes("withAiReady")) {
      console.log("  ✓ next.config.mjs patched with withAiReady()");
    } else {
      console.error("  ✗ next.config.mjs missing withAiReady()");
      failures++;
    }

    // Verify package.json has next-ai-ready build
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    if (pkg.scripts?.build?.includes("next-ai-ready build")) {
      console.log("  ✓ package.json build script patched");
    } else {
      console.error("  ✗ package.json build script not patched");
      failures++;
    }

    // 6. Doctor must exit 0 (warnings OK — MCP token, etc.)
    console.log("[e2e] running doctor --score …");
    const docRun = spawnSync("node", [CLI, "doctor", "--score"], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
      timeout: 30_000,
    });
    const docOut = (docRun.stdout ?? "") + (docRun.stderr ?? "");
    const docLine = docOut.trim().split("\n").filter(Boolean).pop() ?? "";
    if (docRun.status === 0) {
      console.log(`  ✓ doctor exit 0 — ${docLine}`);
    } else {
      console.error(`  ✗ doctor exit ${docRun.status ?? "?"} — ${docLine}`);
      failures++;
    }

    console.log("");
    if (failures > 0) {
      console.error(`[e2e] FAILED — ${failures} check(s) failed`);
      process.exit(1);
    }
    console.log("[e2e] ALL CHECKS PASSED");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("[e2e] FATAL:", err.message);
  process.exit(1);
});
