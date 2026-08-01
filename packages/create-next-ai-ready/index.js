#!/usr/bin/env node

import { lstat, mkdir, readdir, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_TARGET = "my-ai-ready-app";

const FILES = {
  ".gitignore": `.next/
node_modules/
out/
.env*
!.env.example
*.tsbuildinfo
`,
  "app/layout.tsx": `import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My AI-ready app",
  description: "A Next.js site prepared for people and AI agents.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  "app/page.tsx": `export default function Home() {
  return (
    <main>
      <h1>My AI-ready app</h1>
      <p>Edit app/page.tsx to start building your site.</p>
    </main>
  );
}
`,
  "content/index.mdx": `---
title: My AI-ready app
summary: A minimal Next.js application prepared for AI discovery.
description: Replace this content with a clear description of your product or service.
questions:
  - q: What does this site offer?
    a: Replace this answer with a concise description of your offering.
tags:
  - next.js
  - aeo
---

# My AI-ready app

This MDX file is the AI-readable source for your home page. Replace it with useful,
factual content that answers the questions your audience asks.
`,
  "next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited. See https://nextjs.org/docs/app/api-reference/config/typescript
`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`,
};

function packageJson(name) {
  return `${JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        typecheck: "tsc --noEmit",
      },
      dependencies: {
        next: "^15.0.0",
        "next-ai-ready": "alpha",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        zod: "^4.4.3",
      },
      devDependencies: {
        "@types/node": "^20.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        typescript: "^5.6.0",
      },
    },
    null,
    2,
  )}\n`;
}

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

async function assertNoSymlinkComponents(cwd, dir) {
  const rel = relative(cwd, dir);
  let current = cwd;

  for (const part of rel.split(sep)) {
    current = join(current, part);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`Refusing to use a path containing a symbolic link: ${current}`);
      }
      if (!stat.isDirectory()) {
        throw new Error(`Target path component is not a directory: ${current}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}

export async function validateTarget(target, cwd = process.cwd()) {
  if (typeof target !== "string" || target.trim() === "" || target.includes("\0")) {
    throw new Error("Target must be a non-empty relative directory name.");
  }
  if (isAbsolute(target)) {
    throw new Error("Target must be relative to the current directory.");
  }

  const root = resolve(cwd);
  const dir = resolve(root, target);
  if (!isInside(root, dir)) {
    throw new Error("Target must be a child directory and cannot escape the current directory.");
  }

  const pathParts = relative(root, dir).split(sep);
  const unsafePart = pathParts.find(
    (part) => !/^[a-z0-9][a-z0-9._-]*$/.test(part) || part === "." || part === "..",
  );
  if (unsafePart) {
    throw new Error(
      "Target path must use lowercase letters, numbers, dots, underscores, or hyphens.",
    );
  }
  const name = basename(dir);

  await assertNoSymlinkComponents(root, dir);

  try {
    const entries = await readdir(dir);
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${dir}`);
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  return { dir, name };
}

export async function createProject(target = DEFAULT_TARGET, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const { dir, name } = await validateTarget(target, cwd);
  const files = { ...FILES, "package.json": packageJson(name) };

  await mkdir(dir, { recursive: true });
  for (const [relPath, contents] of Object.entries(files)) {
    const path = join(dir, relPath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, { encoding: "utf8", flag: "wx" });
  }

  return { dir, name, files: Object.keys(files).sort() };
}

function packageManager() {
  const agent = process.env.npm_config_user_agent ?? "";
  if (agent.startsWith("pnpm/")) return "pnpm";
  if (agent.startsWith("yarn/")) return "yarn";
  return "npm";
}

function nextSteps(target, manager) {
  const install = manager === "yarn" ? "yarn" : `${manager} install`;
  const exec = manager === "npm" ? "npx" : `${manager} exec`;
  return [`cd ${target}`, install, `${exec} next-ai-ready init`, `${manager} run dev`];
}

function printHelp() {
  console.log(`create-next-ai-ready

Usage:
  npm create next-ai-ready@alpha <directory>

Creates a minimal Next.js App Router TypeScript project with next-ai-ready installed.`);
}

export async function runCli(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  if (argv.length > 1 || argv[0]?.startsWith("-")) {
    throw new Error("Expected one target directory. Use --help for usage.");
  }

  const target = argv[0] ?? DEFAULT_TARGET;
  const result = await createProject(target);
  console.log(`[create-next-ai-ready] created ${result.dir}`);
  console.log("\nNext steps:");
  for (const command of nextSteps(target, packageManager())) console.log(`  ${command}`);
}

async function isDirectRun() {
  if (!process.argv[1]) return false;
  try {
    return await realpath(fileURLToPath(import.meta.url)) === await realpath(resolve(process.argv[1]));
  } catch {
    return false;
  }
}

if (await isDirectRun()) {
  runCli().catch((error) => {
    console.error(`[create-next-ai-ready] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}
