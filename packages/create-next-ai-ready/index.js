#!/usr/bin/env node
/**
 * create-next-ai-ready — minimal scaffold (R-10).
 * Usage: npm create next-ai-ready@alpha my-app
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

async function main() {
  const target = process.argv[2] ?? "my-ai-ready-app";
  const dir = resolve(process.cwd(), target);
  await mkdir(dir, { recursive: true });

  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: target,
        version: "0.0.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "next-ai-ready": "alpha",
          zod: "^4.4.3",
        },
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`[create-next-ai-ready] created ${dir}`);
  console.log(
    "[create-next-ai-ready] next: cd",
    target,
    "&& pnpm install && pnpm exec next-ai-ready init && pnpm exec next-ai-ready build",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
