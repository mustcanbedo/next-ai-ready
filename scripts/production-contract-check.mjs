#!/usr/bin/env node
/* global console, process */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function releaseLabel(version) {
  return version.replace(/^\d+\.\d+\.\d+-/, "");
}

export async function runProductionContractCheck({
  baseUrl = process.env.NEXT_AI_READY_PRODUCTION_URL ?? "https://next-ai-ready.vercel.app",
  fetchImpl = fetch,
  root = ROOT,
} = {}) {
  const manifest = JSON.parse(await readFile(resolve(root, "packages/meta/package.json"), "utf8"));
  const expectedVersion = manifest.version;
  const expectedLabel = releaseLabel(expectedVersion);

  const home = await fetchImpl(`${baseUrl}/en`, {
    headers: { "cache-control": "no-cache" },
    redirect: "follow",
  });
  const homeBody = await home.text();
  assert(home.status === 200, `/en returned ${home.status}, expected 200`);
  assert(
    homeBody.includes(expectedLabel),
    `/en does not expose repository release ${expectedLabel}; production may be stale`,
  );

  const missingPath = "/en/docs/production-contract-missing-page";
  const browserMissing = await fetchImpl(`${baseUrl}${missingPath}`, {
    headers: { accept: "text/html", "user-agent": "Mozilla/5.0 next-ai-ready-production-check" },
    redirect: "manual",
  });
  assert(
    browserMissing.status === 404,
    `${missingPath} returned ${browserMissing.status} for HTML, expected 404`,
  );

  const agentMissing = await fetchImpl(`${baseUrl}${missingPath}`, {
    headers: { accept: "text/markdown", "user-agent": "Vercel-Agent/1.0" },
    redirect: "manual",
  });
  const agentBody = await agentMissing.text();
  assert(agentMissing.status === 200, `${missingPath} returned ${agentMissing.status} for Markdown, expected 200`);
  assert(agentMissing.headers.get("x-robots-tag")?.includes("noindex"), "Markdown recovery is missing noindex");
  assert(agentBody.includes('document_status: "not_found"'), "Markdown recovery is missing not-found metadata");

  const sitemap = await fetchImpl(`${baseUrl}/sitemap.xml`, {
    headers: { "cache-control": "no-cache" },
  });
  const sitemapBody = await sitemap.text();
  assert(sitemap.status === 200, `/sitemap.xml returned ${sitemap.status}, expected 200`);
  for (const machinePath of ["/llms.txt", "/llms-full.txt", "/openapi.json", "/tools.json"]) {
    assert(!sitemapBody.includes(`<loc>${baseUrl}${machinePath}</loc>`), `sitemap.xml includes ${machinePath}`);
  }

  return { baseUrl, expectedVersion };
}

async function main() {
  const result = await runProductionContractCheck();
  console.log(`[production-contract] ${result.baseUrl} matches ${result.expectedVersion}`);
  console.log("[production-contract] deep 404, Markdown recovery, and sitemap boundaries passed");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error("[production-contract] FAILED:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
