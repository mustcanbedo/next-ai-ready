import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runBuild } from "../src/cli/build.js";
import { graphPath, publicLlmsTxtPath, publicLlmsFullTxtPath } from "../src/paths.js";
import { invalidateGraphCache, loadGraph } from "../src/runtime/graph-loader.js";
import { GET as llmsTxtGET } from "../src/handlers/llms-txt.js";
import { GET as pageMdGET } from "../src/handlers/page-md.js";
import { GET as pageAiJsonGET } from "../src/handlers/page-ai-json.js";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "fixtures", "sample-app");

async function clean() {
  await rm(join(SAMPLE, ".next-ai-ready"), { recursive: true, force: true });
  await rm(join(SAMPLE, "public"), { recursive: true, force: true });
  invalidateGraphCache();
}

beforeEach(clean);
afterAll(clean);

describe("runBuild()", () => {
  it("scans content, writes graph.json + public llms artifacts", async () => {
    const result = await runBuild({ cwd: SAMPLE, silent: true });
    expect(result.routes).toBe(2);
    expect(result.filesWritten).toContain(graphPath(SAMPLE));
    expect(result.filesWritten).toContain(publicLlmsTxtPath(SAMPLE));
    expect(result.filesWritten).toContain(publicLlmsFullTxtPath(SAMPLE));

    const graph = JSON.parse(await readFile(graphPath(SAMPLE), "utf8")) as Record<string, unknown>;
    expect((graph.routes as Record<string, string>)["/"]).toBeDefined();
    expect((graph.routes as Record<string, string>)["/docs/install"]).toBeDefined();

    const llmsTxt = await readFile(publicLlmsTxtPath(SAMPLE), "utf8");
    expect(llmsTxt).toContain("# Sample");
    // Section config: "Guides" should appear (priority: high).
    expect(llmsTxt).toContain("## Guides");
    expect(llmsTxt).toContain("[Install](https://sample.test/docs/install)");
  });

  it("is deterministic (same source → identical bytes)", async () => {
    await runBuild({ cwd: SAMPLE, silent: true });
    const a = await readFile(graphPath(SAMPLE), "utf8");
    const aLlms = await readFile(publicLlmsTxtPath(SAMPLE), "utf8");
    await runBuild({ cwd: SAMPLE, silent: true });
    const b = await readFile(graphPath(SAMPLE), "utf8");
    const bLlms = await readFile(publicLlmsTxtPath(SAMPLE), "utf8");
    // Node bodies and ids must match.
    const aGraph = JSON.parse(a) as Record<string, unknown>;
    const bGraph = JSON.parse(b) as Record<string, unknown>;
    delete aGraph.generatedAt;
    delete bGraph.generatedAt;
    expect(JSON.stringify(aGraph)).toBe(JSON.stringify(bGraph));
    expect(aLlms).toBe(bLlms);
  });
});

describe("runtime handlers (post-build)", () => {
  const originalCwd = process.cwd();
  it("serve llms.txt, page.md, page.ai.json from the cached graph", async () => {
    await runBuild({ cwd: SAMPLE, silent: true });
    invalidateGraphCache();
    // Handlers default to process.cwd(); emulate a Next app rooted at SAMPLE.
    process.chdir(SAMPLE);
    try {
    await loadGraph(SAMPLE);

    const llmsResp = await llmsTxtGET(new Request("https://x/llms.txt"));
    expect(llmsResp.headers.get("content-type")).toContain("text/plain");
    expect(await llmsResp.text()).toContain("# Sample");

    const mdResp = await pageMdGET(new Request("https://x/docs/install.md"), {
      params: Promise.resolve({ path: ["docs", "install"] }),
    });
    expect(mdResp.status).toBe(200);
    expect(mdResp.headers.get("content-type")).toContain("text/markdown");
    const md = await mdResp.text();
    expect(md).toContain("title: Install");
    expect(md).toContain("# Install");

    const jsonResp = await pageAiJsonGET(new Request("https://x/docs/install.ai.json"), {
      params: Promise.resolve({ path: ["docs", "install"] }),
    });
    expect(jsonResp.status).toBe(200);
    const data = (await jsonResp.json()) as { route: string; children: unknown[] };
    expect(data.route).toBe("/docs/install");
    expect(Array.isArray(data.children)).toBe(true);

    const missing = await pageMdGET(new Request("https://x/nope.md"), {
      params: Promise.resolve({ path: ["nope"] }),
    });
    expect(missing.status).toBe(404);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
