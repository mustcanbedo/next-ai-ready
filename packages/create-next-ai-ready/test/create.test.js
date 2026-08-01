import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { createProject, validateTarget } from "../index.js";

const execFileAsync = promisify(execFile);
const CLI_PATH = fileURLToPath(new URL("../index.js", import.meta.url));

const REQUIRED_FILES = [
  ".gitignore",
  "app/layout.tsx",
  "app/page.tsx",
  "content/index.mdx",
  "next-env.d.ts",
  "package.json",
  "tsconfig.json",
];

async function workspace() {
  return mkdtemp(join(tmpdir(), "create-next-ai-ready-"));
}

test("creates a runnable App Router TypeScript project", async () => {
  const cwd = await workspace();
  const result = await createProject("demo-app", { cwd });

  assert.equal(result.dir, join(cwd, "demo-app"));
  assert.deepEqual(result.files, REQUIRED_FILES);

  const pkg = JSON.parse(await readFile(join(result.dir, "package.json"), "utf8"));
  assert.equal(pkg.name, "demo-app");
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.dependencies.next, "^15.0.0");
  assert.equal(pkg.dependencies.react, "^19.0.0");
  assert.equal(pkg.dependencies["next-ai-ready"], "alpha");

  const page = await readFile(join(result.dir, "app/page.tsx"), "utf8");
  const content = await readFile(join(result.dir, "content/index.mdx"), "utf8");
  assert.match(page, /export default function Home/);
  assert.match(content, /title: My AI-ready app/);
});

test("accepts an existing empty directory without overwriting files", async () => {
  const cwd = await workspace();
  await mkdir(join(cwd, "empty"));
  const result = await createProject("empty", { cwd });
  assert.equal(result.files.length, REQUIRED_FILES.length);
});

test("rejects the current directory and path traversal", async () => {
  const cwd = await workspace();
  await assert.rejects(() => validateTarget(".", cwd), /child directory/);
  await assert.rejects(() => validateTarget("../escape", cwd), /cannot escape/);
});

test("rejects absolute targets", async () => {
  const cwd = await workspace();
  await assert.rejects(() => validateTarget(resolve(cwd, "absolute"), cwd), /must be relative/);
});

test("rejects existing non-empty directories", async () => {
  const cwd = await workspace();
  const target = join(cwd, "occupied");
  await mkdir(target);
  await writeFile(join(target, "keep.txt"), "user data", "utf8");

  await assert.rejects(() => createProject("occupied", { cwd }), /not empty/);
  assert.equal(await readFile(join(target, "keep.txt"), "utf8"), "user data");
});

test("rejects unsafe package names", async () => {
  const cwd = await workspace();
  await assert.rejects(() => validateTarget("Bad Name", cwd), /lowercase letters/);
  await assert.rejects(() => validateTarget("app;echo-owned", cwd), /lowercase letters/);
  await assert.rejects(() => validateTarget("Unsafe/demo", cwd), /lowercase letters/);
});

test("rejects paths containing symbolic links", async (t) => {
  const cwd = await workspace();
  const outside = await workspace();
  try {
    await symlink(outside, join(cwd, "linked"), "dir");
  } catch (error) {
    if (error?.code === "EPERM") {
      t.skip("symbolic links are unavailable on this platform");
      return;
    }
    throw error;
  }

  await assert.rejects(() => validateTarget("linked/project", cwd), /symbolic link/);
});

test("CLI prints executable npm next steps", async () => {
  const cwd = await workspace();
  const { stdout } = await execFileAsync(process.execPath, [CLI_PATH, "cli-demo"], {
    cwd,
    env: { ...process.env, npm_config_user_agent: "npm/10.0.0 node/v20.0.0" },
  });

  assert.match(stdout, /cd cli-demo/);
  assert.match(stdout, /npm install/);
  assert.match(stdout, /npx next-ai-ready init/);
  assert.match(stdout, /npm run dev/);
});

test("CLI runs when invoked through a package-manager style symlink", async (t) => {
  const cwd = await workspace();
  const binDir = join(cwd, "node_modules", ".bin");
  await mkdir(binDir, { recursive: true });
  const binPath = join(binDir, "create-next-ai-ready");
  try {
    await symlink(CLI_PATH, binPath, "file");
  } catch (error) {
    if (error?.code === "EPERM") {
      t.skip("symbolic links are unavailable on this platform");
      return;
    }
    throw error;
  }

  const { stdout } = await execFileAsync(process.execPath, [binPath, "linked-demo"], { cwd });
  assert.match(stdout, /created .*linked-demo/);
  assert.equal(JSON.parse(await readFile(join(cwd, "linked-demo", "package.json"), "utf8")).name, "linked-demo");
});
