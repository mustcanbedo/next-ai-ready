import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile, mkdir, symlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInit } from "../src/cli/init.js";
import { runBuild } from "../src/cli/build.js";
import { runDoctor } from "../src/cli/doctor.js";
import { GET as llmsTxtGET } from "../src/handlers/llms-txt.js";
import { GET as openapiGET } from "../src/handlers/openapi.js";
import { POST as actionPOST } from "../src/handlers/action.js";
import {
  graphPath,
  publicOpenApiPath,
  publicLlmsTxtPath,
} from "../src/paths.js";
import { invalidateGraphCache, loadGraph } from "../src/runtime/graph-loader.js";
import { invalidateManifestCache } from "../src/runtime/manifest-loader.js";

const originalCwd = process.cwd();

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = join(here, "fixtures");
const META_PKG = resolve(here, "../../meta");

async function linkMetaPackage(dir: string) {
  const nm = join(dir, "node_modules");
  await mkdir(nm, { recursive: true });
  const target = join(nm, "next-ai-ready");
  try {
    await symlink(META_PKG, target, "dir");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
  }
}

async function makePipelineProject() {
  const dir = await mkdtemp(join(FIXTURES_ROOT, "pipeline-"));
  await linkMetaPackage(dir);
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      { name: "e2e-pipeline", private: true, scripts: { build: "next build" }, dependencies: { zod: "^4.4.3" } },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  await mkdir(join(dir, "content"), { recursive: true });
  await writeFile(
    join(dir, "content", "index.mdx"),
    `---
title: Home
description: E2E pipeline test.
updatedAt: "2026-06-01"
author:
  name: Test Author
---

# Home

Pipeline test content.
`,
    "utf8",
  );
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

afterEach(() => {
  process.chdir(originalCwd);
  invalidateGraphCache();
  invalidateManifestCache();
});

describe("init → build → handler pipeline (X-01)", () => {
  it("scaffolds, builds artifacts, serves handlers, and passes doctor with zero errors", async () => {
    const { dir, cleanup } = await makePipelineProject();
    try {
      const init = await runInit({ cwd: dir, silent: true });
      expect(init.written).toContain("ai-ready.config.mjs");
      expect(init.patched.some((p) => p.includes("next.config"))).toBe(true);
      expect(init.patched).toContain("package.json");

      const build = await runBuild({ cwd: dir, silent: true });
      expect(build.routes).toBeGreaterThanOrEqual(1);
      expect(build.actions).toBe(1);

      expect(await readFile(graphPath(dir), "utf8")).toContain('"routes"');
      expect(await readFile(publicLlmsTxtPath(dir), "utf8")).toContain("# My Site");
      expect(await readFile(publicOpenApiPath(dir), "utf8")).toContain("openapi");

      invalidateGraphCache();
      invalidateManifestCache();
      process.chdir(dir);
      await loadGraph(dir);

      const llmsResp = await llmsTxtGET(new Request("https://example.com/llms.txt"));
      expect(llmsResp.status).toBe(200);
      expect(await llmsResp.text()).toContain("My Site");

      const oasResp = await openapiGET(new Request("https://example.com/openapi.json"));
      expect(oasResp.status).toBe(200);
      const oas = (await oasResp.json()) as { openapi?: string; paths?: Record<string, unknown> };
      expect(oas.openapi).toMatch(/^3\.1/);
      expect(oas.paths?.["/api/actions/ping"]).toBeDefined();

      const actionResp = await actionPOST(
        new Request("https://example.com/api/actions/ping", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ msg: "hello" }),
        }),
        { params: Promise.resolve({ name: "ping" }) },
      );
      expect(actionResp.status).toBe(200);
      const actionBody = (await actionResp.json()) as { ok: boolean; data?: { echo?: string } };
      expect(actionBody.ok).toBe(true);
      expect(actionBody.data?.echo).toBe("hello");

      const doctor = await runDoctor({ cwd: dir, score: true });
      expect(doctor.errors).toBe(0);
      expect(doctor.score).toBeGreaterThan(0);
    } finally {
      await cleanup();
    }
  });
});
