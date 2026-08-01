import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runBuild } from "../src/cli/build.js";
import { GET as pageMdGET } from "../src/handlers/page-md.js";
import { invalidateGraphCache } from "../src/runtime/graph-loader.js";

const here = dirname(fileURLToPath(import.meta.url));
const sample = join(here, "fixtures", "sample-app");
const originalCwd = process.cwd();

async function clean() {
  await rm(join(sample, ".next-ai-ready"), { recursive: true, force: true });
  await rm(join(sample, "public"), { recursive: true, force: true });
  invalidateGraphCache();
}

beforeEach(clean);
afterAll(async () => {
  process.chdir(originalCwd);
  await clean();
});

describe("page Markdown recovery", () => {
  it("returns a 200 Markdown recovery document for an explicit missing .md route", async () => {
    await runBuild({ cwd: sample, silent: true });
    process.chdir(sample);

    const response = await pageMdGET(new Request("https://sample.test/docs/instal.md"), {
      params: Promise.resolve({ path: ["docs", "instal"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-location")).toBe("/docs/instal.md");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(response.headers.get("link")).toBeNull();
    const body = await response.text();
    expect(body).toContain('requested_path: "/docs/instal.md"');
    expect(body).toContain("[Install](https://sample.test/docs/install)");
    expect(body).toContain("https://sample.test/llms.txt");
    expect(body).toContain("https://sample.test/sitemap.md");
  });

  it("also recovers when content negotiation routed the original path to this handler", async () => {
    await runBuild({ cwd: sample, silent: true });
    process.chdir(sample);

    const response = await pageMdGET(
      new Request("https://sample.test/unknown", { headers: { accept: "text/markdown" } }),
      { params: Promise.resolve({ path: ["unknown"] }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toContain('requested_path: "/unknown"');
  });

  it("preserves the existing-page response and canonical metadata", async () => {
    await runBuild({ cwd: sample, silent: true });
    process.chdir(sample);

    const response = await pageMdGET(new Request("https://sample.test/docs/install.md"), {
      params: Promise.resolve({ path: ["docs", "install"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(response.headers.get("link")).toBe('<https://sample.test/docs/install>; rel="canonical"');
    expect(response.headers.get("x-robots-tag")).toBeNull();
    expect(await response.text()).toContain("# Install");
  });
});
