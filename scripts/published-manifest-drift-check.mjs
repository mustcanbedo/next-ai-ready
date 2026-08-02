#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PACKAGES_DIR = join(ROOT, "packages");
const PUBLIC_FIELDS = [
  "main",
  "module",
  "types",
  "exports",
  "bin",
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "engines",
];

export function normalizeLocalManifest(pkg, workspaceVersions) {
  const normalized = {};
  for (const field of PUBLIC_FIELDS) {
    if (pkg[field] === undefined) continue;
    if (field.endsWith("Dependencies") || field === "dependencies") {
      normalized[field] = normalizeDependencies(pkg[field], workspaceVersions);
    } else if (field === "bin") {
      normalized[field] = normalizeBin(pkg[field]);
    } else {
      normalized[field] = pkg[field];
    }
  }
  return normalized;
}

export function normalizePublishedManifest(pkg) {
  const normalized = {};
  for (const field of PUBLIC_FIELDS) {
    if (pkg[field] === undefined) continue;
    normalized[field] = field === "bin" ? normalizeBin(pkg[field]) : pkg[field];
  }
  return normalized;
}

function normalizeBin(bin) {
  if (typeof bin === "string") return bin.replace(/^\.\//, "");
  return Object.fromEntries(
    Object.entries(bin).map(([name, path]) => [
      name,
      typeof path === "string" ? path.replace(/^\.\//, "") : path,
    ]),
  );
}

function normalizeDependencies(dependencies, workspaceVersions) {
  return Object.fromEntries(
    Object.entries(dependencies).map(([name, range]) => {
      if (typeof range !== "string" || !range.startsWith("workspace:")) {
        return [name, range];
      }
      const version = workspaceVersions.get(name);
      if (!version) return [name, range.slice("workspace:".length)];
      const selector = range.slice("workspace:".length);
      if (selector === "^") return [name, `^${version}`];
      if (selector === "~") return [name, `~${version}`];
      if (selector === "*") return [name, version];
      return [name, selector];
    }),
  );
}

export function findManifestDrift(local, published) {
  const fields = new Set([...Object.keys(local), ...Object.keys(published)]);
  return [...fields]
    .filter((field) => stableStringify(local[field]) !== stableStringify(published[field]))
    .sort();
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, sortValue(value[key])]),
  );
}

async function npmManifest(name, version) {
  try {
    const { stdout } = await execFileAsync(
      "npm",
      ["view", `${name}@${version}`, ...PUBLIC_FIELDS, "--json"],
      { cwd: ROOT, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 },
    );
    return JSON.parse(stdout);
  } catch (error) {
    const output = `${error?.stdout ?? ""}\n${error?.stderr ?? ""}`;
    if (output.includes("E404") || output.includes("No match found")) return null;
    throw error;
  }
}

async function main() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const manifests = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(PACKAGES_DIR, entry.name, "package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    if (!pkg.private) manifests.push(pkg);
  }

  const workspaceVersions = new Map(manifests.map((pkg) => [pkg.name, pkg.version]));
  let failures = 0;
  for (const pkg of manifests) {
    process.stdout.write(`[registry-manifest] ${pkg.name}@${pkg.version} ... `);
    const published = await npmManifest(pkg.name, pkg.version);
    if (!published) {
      console.log("not published (version bump present)");
      continue;
    }
    const local = normalizeLocalManifest(pkg, workspaceVersions);
    const drift = findManifestDrift(local, normalizePublishedManifest(published));
    if (drift.length === 0) {
      console.log("matches npm");
      continue;
    }
    failures++;
    console.log(`FAILED (${drift.join(", ")})`);
  }

  if (failures > 0) {
    throw new Error(`${failures} package manifest(s) changed without a version bump`);
  }
  console.log("[registry-manifest] all published versions match local public manifests");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("[registry-manifest] FAILED:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
