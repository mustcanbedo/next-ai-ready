#!/usr/bin/env node

/**
 * E-07 — Verify handler subpath exports resolve after build (next + meta).
 *
 * Usage (from repo root, after `pnpm build`):
 *   node scripts/exports-check.mjs
 */

import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const HANDLERS = [
  "llms-txt",
  "llms-full",
  "page-md",
  "page-ai-json",
  "openapi",
  "tools",
  "action",
  "mcp",
  "ai-plugin",
];

const PACKAGES = [
  { name: "@next-ai-ready/next", dir: join(ROOT, "packages", "next") },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta") },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function checkPackage({ name, dir }) {
  let failures = 0;
  const dist = join(dir, "dist", "handlers");

  for (const handler of HANDLERS) {
    const js = join(dist, `${handler}.js`);
    const dts = join(dist, `${handler}.d.ts`);
    if ((await exists(js)) && (await exists(dts))) {
      console.log(`  ✓ ${name} handlers/${handler}`);
    } else {
      console.error(`  ✗ ${name} handlers/${handler} — missing ${js} or ${dts}`);
      failures++;
    }
  }

  const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  for (const handler of HANDLERS) {
    const key = `./handlers/${handler}`;
    if (!pkg.exports?.[key]) {
      console.error(`  ✗ ${name} package.json missing export "${key}"`);
      failures++;
    }
  }

  return failures;
}

async function main() {
  let failures = 0;
  for (const pkg of PACKAGES) {
    failures += await checkPackage(pkg);
  }

  if (failures > 0) {
    console.error(`[exports-check] ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("[exports-check] all handler exports OK");
}

main().catch((err) => {
  console.error("[exports-check] FATAL:", err.message);
  process.exit(1);
});
