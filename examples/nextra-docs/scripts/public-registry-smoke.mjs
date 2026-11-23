#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = "https://registry.npmjs.org/";
const version = process.argv[2];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  assert.match(version ?? "", /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/, "Pass an exact public next-ai-ready version");
  const fixture = await readJson(join(fixtureDir, "package.json"));
  const workspace = await readJson(join(fixtureDir, "../../package.json"));
  const overrides = workspace.pnpm.overrides;
  const temp = await mkdtemp(join(tmpdir(), "nextra-public-registry-"));
  const project = join(temp, "examples", "nextra-docs");
  const pnpm = (...args) => execFileSync("corepack", ["pnpm", ...args], {
    cwd: project,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "inherit",
  });

  try {
    await mkdir(join(project, "scripts"), { recursive: true });
    for (const source of ["app", "content", "mdx-components.js", "ai-ready.config.mjs", "next.config.mjs", "scripts/compatibility-smoke.mjs"]) {
      await cp(join(fixtureDir, source), join(project, source), { recursive: true });
    }
    const manifest = {
      ...fixture,
      name: "nextra-public-registry-smoke",
      packageManager: workspace.packageManager,
      scripts: { ...fixture.scripts, prebuild: "next-ai-ready build" },
      dependencies: { ...fixture.dependencies, "next-ai-ready": version, zod: "4.4.3" },
      pnpm: {
        overrides: {
          "nextra>zod": overrides["nextra>zod"],
          "nextra-theme-docs>zod": overrides["nextra-theme-docs>zod"],
        },
      },
    };
    await writeFile(join(project, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
    await writeFile(join(project, ".npmrc"), `registry=${registry}\n@next-ai-ready:registry=${registry}\n`);

    console.log(`[nextra-public-registry] Node ${process.version}, ${manifest.packageManager}, ${registry}`);
    pnpm("install", "--no-frozen-lockfile", "--reporter", "append-only", "--registry", registry);
    for (const [name, expected] of Object.entries(manifest.dependencies)) {
      const installed = await readJson(join(project, "node_modules", name, "package.json"));
      assert.equal(installed.version, expected, `${name} version`);
      console.log(`  ok ${name}@${installed.version}`);
    }
    for (const name of ["nextra", "nextra-theme-docs", "next-ai-ready"]) {
      const owner = await realpath(join(project, "node_modules", name, "package.json"));
      const zod = await readJson(createRequire(owner).resolve("zod/package.json"));
      const expected = name === "next-ai-ready" ? manifest.dependencies.zod : manifest.pnpm.overrides[`${name}>zod`];
      assert.equal(zod.version, expected, `${name} resolves its intended Zod version`);
      console.log(`  ok ${name} resolves Zod ${zod.version}`);
    }
    pnpm("build");
    pnpm("exec", "next-ai-ready", "doctor", "--score");
    pnpm("test");
  } catch (error) {
    console.error(`[nextra-public-registry] Preserved failing project at ${project}`);
    throw error;
  }

  await rm(temp, { recursive: true, force: true });
  console.log("[nextra-public-registry] Public install, production build and compatibility checks passed");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
