#!/usr/bin/env node
/* global console, process, URL */

/**
 * External install smoke — a clean app installs `next-ai-ready` from packed
 * current-checkout tarballs or npm, then runs init, artifact build, doctor, and an
 * actual Next.js production build.
 *
 * Environment:
 *   PACKAGE_MANAGER=pnpm|npm       consumer package manager (default: pnpm)
 *   NEXT_VERSION=14|15|16          Next.js major (default: 15)
 *   PACKAGE_SOURCE=tarball|registry
 *   REGISTRY_TAG=alpha             npm tag when PACKAGE_SOURCE=registry
 *
 *   node scripts/external-quickstart-smoke.mjs
 */

import { mkdtemp, writeFile, readFile, rm, access, mkdir } from "node:fs/promises";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PACKAGE_DIRS = ["core", "semantic", "actions", "mdx", "llms", "openapi", "mcp", "next", "meta"];
const PACKAGE_MANAGER = process.env.PACKAGE_MANAGER ?? "pnpm";
const NEXT_VERSION = process.env.NEXT_VERSION ?? "15";
const requestedSource = process.env.PACKAGE_SOURCE ?? (process.env.USE_NPM === "1" ? "registry" : "tarball");
const PACKAGE_SOURCE = requestedSource === "workspace" ? "tarball" : requestedSource;
const REGISTRY_TAG = process.env.REGISTRY_TAG ?? "alpha";

if (!new Set(["pnpm", "npm"]).has(PACKAGE_MANAGER)) {
  throw new Error(`Unsupported PACKAGE_MANAGER=${PACKAGE_MANAGER}; expected pnpm or npm.`);
}
if (!new Set(["14", "15", "16"]).has(NEXT_VERSION)) {
  throw new Error(`Unsupported NEXT_VERSION=${NEXT_VERSION}; expected 14, 15, or 16.`);
}
if (!new Set(["tarball", "registry"]).has(PACKAGE_SOURCE)) {
  throw new Error(`Unsupported PACKAGE_SOURCE=${PACKAGE_SOURCE}; expected tarball or registry.`);
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function run(cwd, cmd, args, opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd,
      env: {
        ...process.env,
        NODE_NO_WARNINGS: "1",
        NEXT_TELEMETRY_DISABLED: "1",
        ...opts.env,
      },
      timeout: opts.timeout ?? 120_000,
    });
    return { stdout, stderr };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stdout = err && typeof err === "object" && "stdout" in err ? String(err.stdout) : "";
    const stderr = err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "";
    throw new Error([msg, stdout, stderr].filter(Boolean).join("\n"), { cause: err });
  }
}

async function packWorkspace(packDir) {
  await mkdir(packDir, { recursive: true });
  const artifacts = [];
  for (const packageDir of PACKAGE_DIRS) {
    const cwd = join(ROOT, "packages", packageDir);
    const manifest = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    const { stdout } = await run(
      cwd,
      "pnpm",
      ["pack", "--pack-destination", packDir, "--silent"],
      { timeout: 60_000 },
    );
    const tarball = stdout.trim().split("\n").filter(Boolean).pop();
    if (!tarball || !(await exists(tarball))) {
      throw new Error(`pnpm pack did not produce a tarball for packages/${packageDir}`);
    }
    const { stdout: packedManifestText } = await run(
      cwd,
      "tar",
      ["-xOf", tarball, "package/package.json"],
    );
    const packedManifest = JSON.parse(packedManifestText);
    if (JSON.stringify(packedManifest).includes("workspace:")) {
      throw new Error(`${manifest.name} tarball still contains a workspace: dependency`);
    }
    artifacts.push({ name: manifest.name, tarball, version: packedManifest.version });
  }
  return artifacts;
}

async function configureTarballResolution(dir, artifacts) {
  if (PACKAGE_SOURCE !== "tarball") return;
  const packageJsonPath = join(dir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const scopedArtifacts = artifacts.filter(({ name }) => name.startsWith("@next-ai-ready/"));
  const overrides = Object.fromEntries(
    scopedArtifacts.map(({ name, tarball }) => [name, `file:${tarball}`]),
  );
  packageJson.pnpm = {
    ...(packageJson.pnpm ?? {}),
    overrides,
  };
  packageJson.overrides = overrides;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  await writeFile(join(dir, ".npmrc"), "@next-ai-ready:registry=http://127.0.0.1:9/\n");
}

async function installConsumerDependencies(dir) {
  if (PACKAGE_MANAGER === "pnpm") {
    await run(dir, "pnpm", ["install", "--no-frozen-lockfile"], { timeout: 300_000 });
    return;
  }
  await run(
    dir,
    "npm",
    ["install", "--no-audit", "--no-fund"],
    { timeout: 300_000 },
  );
}

async function configureConsumerManifest(dir, artifacts) {
  const packageJsonPath = join(dir, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  const metaArtifact = artifacts.find(({ name }) => name === "next-ai-ready");
  if (PACKAGE_SOURCE === "tarball" && !metaArtifact) {
    throw new Error("next-ai-ready tarball was not produced");
  }
  const reactVersion = NEXT_VERSION === "14"
    ? "^18.2.0"
    : NEXT_VERSION === "15"
      ? "^19.0.0"
      : "^19.2.0";
  const reactTypesVersion = NEXT_VERSION === "14" ? "^18" : "^19";
  packageJson.dependencies = {
    "next-ai-ready": PACKAGE_SOURCE === "tarball"
      ? `file:${metaArtifact.tarball}`
      : `npm:next-ai-ready@${REGISTRY_TAG}`,
    next: `^${NEXT_VERSION}`,
    react: reactVersion,
    "react-dom": reactVersion,
    zod: "^4",
  };
  packageJson.devDependencies = {
    "@types/node": "^20",
    "@types/react": reactTypesVersion,
    "@types/react-dom": reactTypesVersion,
    typescript: "^5.6",
  };
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

async function verifyTarballResolution(dir, artifacts) {
  if (PACKAGE_SOURCE !== "tarball") return;
  const packageJson = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  const directNames = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
  if (directNames.some((name) => name.startsWith("@next-ai-ready/"))) {
    throw new Error("Consumer manifest directly depends on a scoped next-ai-ready package");
  }

  const lockPath = join(dir, PACKAGE_MANAGER === "pnpm" ? "pnpm-lock.yaml" : "package-lock.json");
  const lockText = await readFile(lockPath, "utf8");
  for (const artifact of artifacts) {
    if (!lockText.includes(basename(artifact.tarball))) {
      throw new Error(`${artifact.name} lock entry does not reference ${basename(artifact.tarball)}`);
    }
  }
}

async function main() {
  const tempRoot = await mkdtemp(join(tmpdir(), "nair-ext-"));
  const dir = join(tempRoot, "app");
  const packDir = join(tempRoot, "packs");
  console.log(
    `[external] ${PACKAGE_MANAGER} / Next ${NEXT_VERSION} / ${PACKAGE_SOURCE} — temp project: ${dir}`,
  );

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "external-quickstart-smoke",
          version: "0.0.0",
          private: true,
          type: "module",
          ...(PACKAGE_MANAGER === "pnpm" ? { packageManager: "pnpm@9.12.0" } : {}),
          scripts: { build: "next build" },
        },
        null,
        2,
      ) + "\n",
    );
    await writeFile(
      join(dir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "preserve",
            strict: true,
          },
        },
        null,
        2,
      ) + "\n",
    );

    const artifacts = PACKAGE_SOURCE === "tarball" ? await packWorkspace(packDir) : [];
    await configureConsumerManifest(dir, artifacts);
    await configureTarballResolution(dir, artifacts);
    console.log(`[external] installing next-ai-ready (${PACKAGE_SOURCE}) …`);
    await installConsumerDependencies(dir);
    await verifyTarballResolution(dir, artifacts);

    const installedNext = JSON.parse(await readFile(join(dir, "node_modules", "next", "package.json"), "utf8"));
    const installedMeta = JSON.parse(
      await readFile(join(dir, "node_modules", "next-ai-ready", "package.json"), "utf8"),
    );
    if (!String(installedNext.version).startsWith(`${NEXT_VERSION}.`)) {
      throw new Error(`Expected Next ${NEXT_VERSION}.x, installed ${installedNext.version}`);
    }
    console.log(`  ✓ next ${installedNext.version}; next-ai-ready ${installedMeta.version}`);

    await mkdir(join(dir, "content"), { recursive: true });
    await mkdir(join(dir, "app"), { recursive: true });
    await writeFile(
      join(dir, "content", "index.mdx"),
      "---\ntitle: Home\nsummary: Smoke test page.\n---\n\n# Home\n",
      "utf8",
    );
    await writeFile(
      join(dir, "app", "layout.tsx"),
      `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
`,
      "utf8",
    );
    await writeFile(
      join(dir, "app", "page.tsx"),
      `export default function HomePage() {
  return <main><h1>External quickstart</h1><p>Next ${NEXT_VERSION} compatibility smoke.</p></main>;
}
`,
      "utf8",
    );

    const cli = join(dir, "node_modules", "next-ai-ready", "dist", "cli.js");
    if (!(await exists(cli))) throw new Error(`CLI not found at ${cli}`);

    console.log("[external] init …");
    await run(dir, "node", [cli, "init"]);

    const config = await readFile(join(dir, "ai-ready.config.ts"), "utf8");
    if (config.includes("@next-ai-ready/")) {
      throw new Error("init still imports @next-ai-ready/* — use next-ai-ready only");
    }

    console.log("[external] build …");
    await run(dir, "node", [cli, "build"]);

    for (const rel of [
      ".next-ai-ready/graph.json",
      "public/llms.txt",
      "public/sitemap.md",
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

    console.log("[external] next build …");
    await run(dir, PACKAGE_MANAGER, ["run", "build"], { timeout: 300_000 });
    if (!(await exists(join(dir, ".next", "BUILD_ID")))) {
      throw new Error("next build completed without .next/BUILD_ID");
    }
    console.log("  ✓ production build emitted .next/BUILD_ID");

    console.log(
      `\n[external] ALL CHECKS PASSED (${PACKAGE_MANAGER}, Next ${NEXT_VERSION}, ${PACKAGE_SOURCE})`,
    );
  } finally {
    if (process.env.KEEP_TEMP === "1") {
      console.log(`[external] KEEP_TEMP=1 — preserved ${tempRoot}`);
    } else {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
}

main().catch((err) => {
  console.error("[external] FAILED:", err.message);
  process.exit(1);
});
