#!/usr/bin/env node

/**
 * E-07 — Verify handler subpath exports resolve after build (next + meta + core).
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

const HANDLER_PACKAGES = [
  { name: "@next-ai-ready/next", dir: join(ROOT, "packages", "next") },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta") },
];

const EXTRA_EXPORTS = [
  { name: "@next-ai-ready/next", dir: join(ROOT, "packages", "next"), key: "./config", js: "config.js", dts: "config.d.ts" },
  { name: "@next-ai-ready/next", dir: join(ROOT, "packages", "next"), key: "./json-ld", js: "jsonld.js", dts: "jsonld.d.ts" },
  { name: "@next-ai-ready/next", dir: join(ROOT, "packages", "next"), key: "./hooks", js: "runtime/observability.js", dts: "runtime/observability.d.ts" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./actions", js: "actions.js", dts: "actions.d.ts" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./hooks", js: "hooks.js", dts: "hooks.d.ts" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./json-ld", js: "json-ld.js", dts: "json-ld.d.ts" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./audit", js: "audit.js", dts: "audit.d.ts" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./config", js: "config.js", dts: "config.d.ts", cjs: "config.cjs" },
  { name: "next-ai-ready", dir: join(ROOT, "packages", "meta"), key: "./robots", js: "robots.js", dts: "robots.d.ts" },
  { name: "@next-ai-ready/core", dir: join(ROOT, "packages", "core"), key: "./bots", js: "bots-entry.js", dts: "bots-entry.d.ts" },
  { name: "@next-ai-ready/core", dir: join(ROOT, "packages", "core"), key: "./json", js: "json.js", dts: "json.d.ts" },
  { name: "@next-ai-ready/core", dir: join(ROOT, "packages", "core"), key: "./robots", js: "robots.js", dts: "robots.d.ts" },
  { name: "@next-ai-ready/core", dir: join(ROOT, "packages", "core"), key: "./url", js: "url.js", dts: "url.d.ts" },
  { name: "@next-ai-ready/semantic", dir: join(ROOT, "packages", "semantic"), key: "./jsonld", js: "jsonld.js", dts: "jsonld.d.ts" },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function checkHandlerPackage({ name, dir }) {
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

async function checkExtraExport({ name, dir, key, js, dts, cjs }) {
  let failures = 0;
  const jsPath = join(dir, "dist", js);
  const dtsPath = join(dir, "dist", dts);
  if ((await exists(jsPath)) && (await exists(dtsPath))) {
    console.log(`  ✓ ${name} ${key.replace("./", "")}`);
  } else {
    console.error(`  ✗ ${name} ${key} — missing ${jsPath} or ${dtsPath}`);
    failures++;
  }

  const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  if (!pkg.exports?.[key]) {
    console.error(`  ✗ ${name} package.json missing export "${key}"`);
    failures++;
  }
  if (cjs) {
    const cjsPath = join(dir, "dist", cjs);
    if (!(await exists(cjsPath)) || pkg.exports?.[key]?.require !== `./dist/${cjs}`) {
      console.error(`  ✗ ${name} ${key} — missing CommonJS export ${cjsPath}`);
      failures++;
    }
  }

  return failures;
}

async function main() {
  let failures = 0;
  for (const pkg of HANDLER_PACKAGES) {
    failures += await checkHandlerPackage(pkg);
  }
  for (const exp of EXTRA_EXPORTS) {
    failures += await checkExtraExport(exp);
  }

  if (failures > 0) {
    console.error(`[exports-check] ${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("[exports-check] all package exports OK");
}

main().catch((err) => {
  console.error("[exports-check] FATAL:", err.message);
  process.exit(1);
});
