#!/usr/bin/env node
/* global console, process */

import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const TAG_PATTERN = /^[0-9A-Za-z][0-9A-Za-z._-]*$/;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error("Expected --package, --bad, --good, and optional --tag value pairs.");
    }
    args[key.slice(2)] = value;
  }
  return args;
}

async function publishablePackages() {
  const packagesDir = resolve(ROOT, "packages");
  const directories = await readdir(packagesDir, { withFileTypes: true });
  const names = [];
  for (const directory of directories) {
    if (!directory.isDirectory()) continue;
    const manifest = JSON.parse(
      await readFile(resolve(packagesDir, directory.name, "package.json"), "utf8"),
    );
    if (!manifest.private && manifest.name) names.push(manifest.name);
  }
  return names.sort();
}

function quote(value) {
  return `'${value}'`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageNames = await publishablePackages();
  if (!packageNames.includes(args.package)) {
    throw new Error(`Unknown publishable package: ${args.package ?? "(missing)"}`);
  }
  if (!VERSION_PATTERN.test(args.bad ?? "") || !VERSION_PATTERN.test(args.good ?? "")) {
    throw new Error("--bad and --good must be exact SemVer versions.");
  }
  if (args.bad === args.good) throw new Error("--bad and --good must differ.");

  const tag = args.tag ?? "latest";
  if (!TAG_PATTERN.test(tag) || VERSION_PATTERN.test(tag)) {
    throw new Error("--tag is not a valid npm dist-tag.");
  }

  const packageName = quote(args.package);
  const badSpec = quote(`${args.package}@${args.bad}`);
  const goodSpec = quote(`${args.package}@${args.good}`);
  console.log(`# Review only: verify ${args.good} is the known-good version before running writes.`);
  console.log(`npm view ${packageName} versions --json`);
  console.log(`npm view ${packageName} dist-tags --json`);
  console.log(`npm deprecate ${badSpec} "Rollback: install ${args.package}@${args.good} instead."`);
  console.log(`npm dist-tag add ${goodSpec} ${tag}`);
  console.log(`npm view ${packageName} dist-tags --json`);
  console.log(`npm view ${goodSpec} version`);
}

main().catch((error) => {
  console.error("[release-rollback-plan]", error instanceof Error ? error.message : error);
  process.exit(1);
});
