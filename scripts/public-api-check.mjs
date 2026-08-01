#!/usr/bin/env node
/* global console, process */

import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT_PATH), "..");
const BASELINE_PATH = process.env.NEXT_AI_READY_API_BASELINE
  ? resolve(process.env.NEXT_AI_READY_API_BASELINE)
  : resolve(ROOT, "scripts/public-api-baseline.json");

if (process.env.NEXT_AI_READY_API_CHECK_CHILD !== "1") {
  const result = spawnSync(
    process.execPath,
    ["--conditions=react-server", SCRIPT_PATH],
    {
      cwd: ROOT,
      env: { ...process.env, NEXT_AI_READY_API_CHECK_CHILD: "1" },
      stdio: "inherit",
    },
  );
  process.exit(result.status ?? 1);
}

function stableKeys(value) {
  return Object.keys(value ?? {}).sort();
}

function sameList(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function exportTarget(target, condition) {
  if (typeof target === "string") return target;
  return target?.[condition];
}

async function main() {
  const baseline = JSON.parse(await readFile(BASELINE_PATH, "utf8"));
  let failures = 0;

  for (const [packageName, expected] of Object.entries(baseline.packages)) {
    let packageFailures = 0;
    const packageDir = resolve(ROOT, expected.directory);
    const manifest = JSON.parse(await readFile(resolve(packageDir, "package.json"), "utf8"));
    if (manifest.name !== packageName) {
      console.error(`  x ${packageName}: manifest name is ${manifest.name}`);
      failures++;
      continue;
    }

    const actualEntrypoints = stableKeys(manifest.exports);
    const expectedEntrypoints = stableKeys(expected.entrypoints);
    if (!sameList(actualEntrypoints, expectedEntrypoints)) {
      console.error(`  x ${packageName}: entrypoints changed`);
      console.error(`    expected: ${expectedEntrypoints.join(", ") || "(none)"}`);
      console.error(`    actual:   ${actualEntrypoints.join(", ") || "(none)"}`);
      failures++;
      packageFailures++;
    }

    const actualBin = manifest.bin ?? {};
    const expectedBin = expected.bin ?? {};
    if (JSON.stringify(actualBin) !== JSON.stringify(expectedBin)) {
      console.error(`  x ${packageName}: bin contract changed`);
      failures++;
      packageFailures++;
    }

    for (const [entrypoint, expectedSymbols] of Object.entries(expected.entrypoints)) {
      const target = manifest.exports?.[entrypoint];
      const importTarget = exportTarget(target, "import");
      const typesTarget = exportTarget(target, "types");
      if (!importTarget || !typesTarget) {
        console.error(`  x ${packageName}${entrypoint}: import/types target missing`);
        failures++;
        packageFailures++;
        continue;
      }

      const importPath = resolve(packageDir, importTarget);
      const typesPath = resolve(packageDir, typesTarget);
      if (!(await exists(importPath)) || !(await exists(typesPath))) {
        console.error(`  x ${packageName}${entrypoint}: build output missing; run pnpm build first`);
        failures++;
        packageFailures++;
        continue;
      }

      const declarationHash = createHash("sha256")
        .update(await readFile(typesPath))
        .digest("hex");
      if (declarationHash !== expected.declarationHashes?.[entrypoint]) {
        console.error(`  x ${packageName}${entrypoint}: TypeScript declaration changed`);
        console.error(`    expected: ${expected.declarationHashes?.[entrypoint] ?? "(missing)"}`);
        console.error(`    actual:   ${declarationHash}`);
        failures++;
        packageFailures++;
      }

      const module = await import(pathToFileURL(importPath).href);
      const actualSymbols = stableKeys(module);
      const sortedExpectedSymbols = [...expectedSymbols].sort();
      if (!sameList(actualSymbols, sortedExpectedSymbols)) {
        console.error(`  x ${packageName}${entrypoint}: named exports changed`);
        console.error(`    expected: ${sortedExpectedSymbols.join(", ") || "(none)"}`);
        console.error(`    actual:   ${actualSymbols.join(", ") || "(none)"}`);
        failures++;
        packageFailures++;
      }
    }

    for (const target of Object.values(expectedBin)) {
      if (!(await exists(resolve(packageDir, target)))) {
        console.error(`  x ${packageName}: bin target ${target} does not exist`);
        failures++;
        packageFailures++;
      }
    }

    if (packageFailures === 0) console.log(`  ok ${packageName}`);
  }

  if (failures > 0) {
    console.error(`[public-api-check] ${failures} contract check(s) failed`);
    process.exit(1);
  }
  console.log(`[public-api-check] ${Object.keys(baseline.packages).length} package contracts match the ${baseline.releaseLine} baseline`);
}

main().catch((error) => {
  console.error("[public-api-check] FATAL:", error instanceof Error ? error.message : error);
  process.exit(1);
});
