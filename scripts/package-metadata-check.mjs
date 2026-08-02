#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const packagesDir = join(root, "packages");
const requiredFields = ["description", "license", "homepage", "repository", "bugs", "keywords"];
const failures = [];

for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const directory = join(packagesDir, entry.name);
  const manifest = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  if (manifest.private) continue;

  for (const field of requiredFields) {
    if (manifest[field] == null || manifest[field] === "" || (Array.isArray(manifest[field]) && manifest[field].length === 0)) {
      failures.push(`${manifest.name}: missing ${field}`);
    }
  }

  if (!manifest.repository?.url || manifest.repository.directory !== `packages/${entry.name}`) {
    failures.push(`${manifest.name}: repository must identify packages/${entry.name}`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("README.md")) {
    failures.push(`${manifest.name}: files must include README.md`);
  }
  try {
    await access(join(directory, "README.md"));
  } catch {
    failures.push(`${manifest.name}: README.md is missing`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `[metadata-check] ${failure}`).join("\n"));
  process.exit(1);
}

console.log("[metadata-check] all public packages include searchable npm metadata and README files");
