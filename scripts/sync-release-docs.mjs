#!/usr/bin/env node
/* global console, process */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const FULL_VERSION = /\d+\.\d+\.\d+(?:-alpha\.\d+)?/g;
const RELEASE_LABEL = /(?:alpha\.\d+|\d+\.\d+\.\d+)/g;

export const releaseDocRules = [
  {
    path: "README.md",
    lines: [
      { includes: "> **Release candidate:**", token: "full" },
      { includes: "Install only `next-ai-ready` in consumer apps.", token: "short" },
      { includes: "🚧 **Pre-alpha**", token: "full" },
    ],
  },
  {
    path: "README.zh-CN.md",
    lines: [
      { includes: "> **候选版本：**", token: "full" },
      { includes: "消费者应用只需安装 `next-ai-ready`。", token: "short" },
      { includes: "🚧 **Pre-alpha**", token: "full" },
    ],
  },
  {
    path: "docs/improvement-plan.zh-CN.md",
    lines: [
      { includes: "> 当前仓库候选：", token: "full" },
      { includes: "| npm GA |", token: "full" },
      { includes: "| G1-07 |", token: "short" },
    ],
  },
  {
    path: "docs/ga-readiness.md",
    lines: [
      { includes: "**Current repository candidate:**", token: "full" },
      { includes: "Repository candidate **", token: "short" },
    ],
  },
  {
    path: "docs/completion-audit.md",
    lines: [{ includes: "**当前候选发布补充", token: "full" }],
  },
  {
    path: "docs/external-quickstart-verification.md",
    lines: [{ includes: "- **Repository candidate:**", token: "full" }],
  },
  {
    path: "examples/docs-site/messages/en.ts",
    lines: [{ includes: "badge: \"", token: "short" }],
  },
  {
    path: "examples/docs-site/messages/zh.ts",
    lines: [{ includes: "badge: \"", token: "short" }],
  },
  {
    path: "examples/docs-site/content/en/index.mdx",
    lines: [{ includes: "This documentation site tracks `main` and currently targets", token: "full" }],
  },
  {
    path: "examples/docs-site/content/zh/index.mdx",
    lines: [{ includes: "本文档站跟随 `main`，当前目标为仓库候选版本", token: "full" }],
  },
  {
    path: "examples/docs-site/content/en/docs/installation.mdx",
    lines: [{ includes: "> **Release channel:**", token: "full" }],
  },
  {
    path: "examples/docs-site/content/zh/docs/installation.mdx",
    lines: [{ includes: "> **发布渠道：**", token: "full" }],
  },
  {
    path: "examples/docs-site/scripts/docs-site-route-smoke.mjs",
    lines: [{ includes: "const expectedReleaseVersion =", token: "full" }],
  },
];

function replaceCurrentVersionToken(line, pattern, replacement) {
  const matches = [...line.matchAll(pattern)].map((match) => match[0]);
  const current = matches.find((match) => match.includes("-alpha.")) ?? matches[0];
  if (!current) return line;

  const escaped = current.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return line.replace(new RegExp(escaped, "g"), replacement);
}

export function syncReleaseDoc(content, rules, version) {
  const shortVersion = version.replace(/^\d+\.\d+\.\d+-/, "");
  const lines = content.split("\n");

  for (const rule of rules) {
    const matches = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes(rule.includes));
    if (matches.length !== 1) {
      throw new Error(`Expected one line containing ${JSON.stringify(rule.includes)}, found ${matches.length}`);
    }

    const { index } = matches[0];
    const pattern = rule.token === "short" ? RELEASE_LABEL : FULL_VERSION;
    const replacement = rule.token === "short" ? shortVersion : version;
    const updated = replaceCurrentVersionToken(lines[index], pattern, replacement);
    if (updated === lines[index] && !lines[index].includes(replacement)) {
      throw new Error(`Release version token is missing from line containing ${JSON.stringify(rule.includes)}`);
    }
    lines[index] = updated;
  }

  return lines.join("\n");
}

export async function syncReleaseDocs({ check = false, root = ROOT } = {}) {
  const manifest = JSON.parse(await readFile(resolve(root, "packages/meta/package.json"), "utf8"));
  const version = manifest.version;
  if (!/^\d+\.\d+\.\d+(?:-alpha\.\d+)?$/.test(version)) {
    throw new Error(`Expected a stable or alpha package version, received ${JSON.stringify(version)}`);
  }

  const changed = [];
  for (const target of releaseDocRules) {
    const path = resolve(root, target.path);
    const before = await readFile(path, "utf8");
    const after = syncReleaseDoc(before, target.lines, version);
    if (before === after) continue;
    changed.push(target.path);
    if (!check) await writeFile(path, after);
  }

  return { changed, version };
}

async function main() {
  const check = process.argv.includes("--check");
  const { changed, version } = await syncReleaseDocs({ check });
  if (check && changed.length > 0) {
    console.error(`[release-docs] ${version} is not synchronized in:`);
    console.error(changed.map((path) => `  ${path}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  if (changed.length === 0) {
    console.log(`[release-docs] ${version} already synchronized`);
    return;
  }
  console.log(`[release-docs] synchronized ${version} in ${changed.length} source files`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error("[release-docs] FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
