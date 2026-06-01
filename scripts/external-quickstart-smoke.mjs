#!/usr/bin/env node

/**
 * External install smoke — only `next-ai-ready` at project root (no scoped deps).
 * Simulates `pnpm add next-ai-ready@alpha` after alpha.5 single-package fix.
 *
 * Optional: USE_NPM=1 installs from registry instead of workspace link.
 *
 *   node scripts/external-quickstart-smoke.mjs
 */

import { mkdtemp, writeFile, readFile, rm, access, mkdir } from "node:fs/promises";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const META_DIR = join(ROOT, "packages", "meta");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function run(cwd, cmd, args, opts = {}) {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    cwd,
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
    timeout: opts.timeout ?? 120_000,
  });
  return { stdout, stderr };
}

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "nair-ext-"));
  console.log(`[external] temp project: ${dir}`);

  try {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "external-quickstart-smoke",
          version: "0.0.0",
          private: true,
          type: "module",
          scripts: { build: "next build" },
        },
        null,
        2,
      ) + "\n",
    );

    if (process.env.USE_NPM === "1") {
      console.log("[external] installing next-ai-ready@alpha from npm …");
      await run(dir, "pnpm", ["add", "next-ai-ready@alpha", "zod@^4", "-D", "next@^15"], {
        timeout: 180_000,
      });
    } else {
      console.log("[external] installing next-ai-ready (workspace link only) …");
      await run(
        dir,
        "pnpm",
        ["add", `link:${META_DIR}`, "zod@^4", "-D", "next@^15"],
        { timeout: 180_000 },
      );
    }

    await mkdir(join(dir, "content"), { recursive: true });
    await writeFile(
      join(dir, "content", "index.mdx"),
      "---\ntitle: Home\nsummary: Smoke test page.\n---\n\n# Home\n",
      "utf8",
    );

    const cli = join(dir, "node_modules", "next-ai-ready", "dist", "cli.js");
    if (!(await exists(cli))) throw new Error(`CLI not found at ${cli}`);

    console.log("[external] init …");
    await run(dir, "node", [cli, "init"]);

    const config = await readFile(join(dir, "ai-ready.config.mjs"), "utf8");
    if (config.includes("@next-ai-ready/")) {
      throw new Error("init still imports @next-ai-ready/* — use next-ai-ready only");
    }

    console.log("[external] build …");
    await run(dir, "node", [cli, "build"]);

    for (const rel of [
      ".next-ai-ready/graph.json",
      "public/llms.txt",
      "public/openapi.json",
      "instrumentation.ts",
    ]) {
      if (!(await exists(join(dir, rel)))) throw new Error(`missing ${rel}`);
      console.log(`  ✓ ${rel}`);
    }

    console.log("[external] doctor --score …");
    const doctor = spawnSync("node", [cli, "doctor", "--score"], {
      cwd: dir,
      encoding: "utf8",
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    if (doctor.status !== 0) {
      console.error(doctor.stdout);
      console.error(doctor.stderr);
      throw new Error(`doctor exit ${doctor.status}`);
    }
    console.log(`  ✓ doctor exit 0 — ${doctor.stdout.trim().split("\n").pop()}`);

    console.log("\n[external] ALL CHECKS PASSED (single-package install path)");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("[external] FAILED:", err.message);
  process.exit(1);
});
