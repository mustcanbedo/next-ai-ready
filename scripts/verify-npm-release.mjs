#!/usr/bin/env node
/* global console, process, setTimeout */

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PACKAGES_DIR = join(ROOT, "packages");
const PROMOTED_PACKAGES = new Set([
  "next-ai-ready",
  "@next-ai-ready/next",
  "create-next-ai-ready",
]);
const DEFAULT_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_INTERVAL_MS = 5_000;

export function inspectRegistryRelease(packages, registryManifests, { requireLatest = false } = {}) {
  const failures = [];

  for (const pkg of packages) {
    const registry = registryManifests.get(pkg.name);
    if (!registry) {
      failures.push(`${pkg.name}: registry metadata unavailable`);
      continue;
    }
    if (!registry.versions?.[pkg.version]) {
      failures.push(`${pkg.name}: version ${pkg.version} is not visible`);
    }
    if (registry["dist-tags"]?.alpha !== pkg.version) {
      failures.push(
        `${pkg.name}: alpha is ${registry["dist-tags"]?.alpha ?? "missing"}, expected ${pkg.version}`,
      );
    }
    if (requireLatest && PROMOTED_PACKAGES.has(pkg.name) && registry["dist-tags"]?.latest !== pkg.version) {
      failures.push(
        `${pkg.name}: latest is ${registry["dist-tags"]?.latest ?? "missing"}, expected ${pkg.version}`,
      );
    }
  }

  return failures;
}

export async function waitForRegistryRelease(
  packages,
  {
    fetchManifest,
    requireLatest = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    intervalMs = DEFAULT_INTERVAL_MS,
    now = Date.now,
    sleep = (delay) => new Promise((resolveSleep) => setTimeout(resolveSleep, delay)),
    onRetry = () => {},
  },
) {
  const deadline = now() + timeoutMs;
  let attempts = 0;
  let failures = [];

  do {
    attempts += 1;
    const registryManifests = new Map();
    await Promise.all(
      packages.map(async (pkg) => {
        try {
          registryManifests.set(pkg.name, await fetchManifest(pkg.name));
        } catch {
          registryManifests.set(pkg.name, null);
        }
      }),
    );
    failures = inspectRegistryRelease(packages, registryManifests, { requireLatest });
    if (failures.length === 0) return { attempts };
    if (now() >= deadline) break;
    onRetry({ attempts, failures });
    await sleep(intervalMs);
  } while (now() <= deadline);

  throw new Error(`npm registry did not converge:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
}

async function publishablePackages() {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
  const packages = [];
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const manifest = JSON.parse(await readFile(join(PACKAGES_DIR, entry.name, "package.json"), "utf8"));
    if (!manifest.private && manifest.name && manifest.version) {
      packages.push({ name: manifest.name, version: manifest.version });
    }
  }
  return packages;
}

async function registryManifest(name) {
  const url = new URL(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  url.searchParams.set("cache", `${Date.now()}`);
  const response = await fetch(url, { headers: { "cache-control": "no-cache" } });
  if (!response.ok) throw new Error(`${name}: registry returned ${response.status}`);
  return response.json();
}

function positiveInteger(value, fallback, label) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const allowed = new Set(["--require-latest"]);
  const unknown = [...args].filter((arg) => !allowed.has(arg));
  if (unknown.length > 0) throw new Error(`Unknown argument(s): ${unknown.join(", ")}`);

  const packages = await publishablePackages();
  const requireLatest = args.has("--require-latest");
  const timeoutMs = positiveInteger(process.env.NPM_RELEASE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, "NPM_RELEASE_TIMEOUT_MS");
  const intervalMs = positiveInteger(process.env.NPM_RELEASE_INTERVAL_MS, DEFAULT_INTERVAL_MS, "NPM_RELEASE_INTERVAL_MS");
  console.log(
    `[npm-release] waiting for ${packages.length} package version(s) and alpha tags${requireLatest ? " plus user-facing latest tags" : ""}`,
  );

  const result = await waitForRegistryRelease(packages, {
    fetchManifest: registryManifest,
    requireLatest,
    timeoutMs,
    intervalMs,
    onRetry: ({ attempts, failures }) => {
      console.log(`[npm-release] attempt ${attempts} pending: ${failures.join("; ")}`);
    },
  });
  console.log(`[npm-release] registry verified after ${result.attempts} attempt(s)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("[npm-release] FAILED:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
