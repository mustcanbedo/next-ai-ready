import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { z } from "zod";
import { readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { defineAction, clearRegistry } from "@next-ai-ready/actions";
import { runBuild } from "../src/cli/build.js";
import { actionsManifestPath, publicOpenApiPath, publicToolsJsonPath, publicAiPluginPath } from "../src/paths.js";
import { invalidateGraphCache } from "../src/runtime/graph-loader.js";
import { invalidateManifestCache } from "../src/runtime/manifest-loader.js";
import { GET as openApiGET } from "../src/handlers/openapi.js";
import { GET as toolsGET } from "../src/handlers/tools.js";
import { POST as actionPOST } from "../src/handlers/action.js";

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, "fixtures", "sample-app");

function inlineConfig() {
  return {
    site: {
      name: "Sample",
      baseUrl: "https://sample.test",
      description: "Sample app for testing the build pipeline.",
    },
    content: ["content/**/*.mdx"],
    actions: [
      defineAction({
        name: "echo",
        description: "Echoes the input message back.",
        whenToUse: "Smoke-test the action invocation pipeline.",
        public: true,
        input: z.object({ msg: z.string().min(1) }),
        output: z.object({ echo: z.string() }),
        handler: async ({ msg }: { msg: string }) => ({ echo: msg }),
      }),
      defineAction({
        name: "admin_delete",
        description: "Deletes a record.",
        whenToUse: "Never expose this to AI.",
        public: false,
        input: z.object({ id: z.string() }),
        handler: async ({ id }: { id: string }) => ({ deleted: id }),
      }),
    ],
  };
}

async function clean() {
  await rm(join(SAMPLE, ".next-ai-ready"), { recursive: true, force: true });
  await rm(join(SAMPLE, "public"), { recursive: true, force: true });
  invalidateGraphCache();
  invalidateManifestCache();
  clearRegistry();
}

beforeEach(clean);
afterAll(clean);

describe("runBuild() — Capability plane", () => {
  it("emits actions.manifest.json, openapi.json, tools.json, ai-plugin.json", async () => {
    const result = await runBuild({ cwd: SAMPLE, config: inlineConfig(), silent: true });
    expect(result.actions).toBe(2);
    expect(result.filesWritten).toContain(actionsManifestPath(SAMPLE));
    expect(result.filesWritten).toContain(publicOpenApiPath(SAMPLE));
    expect(result.filesWritten).toContain(publicToolsJsonPath(SAMPLE));
    expect(result.filesWritten).toContain(publicAiPluginPath(SAMPLE));

    const openapi = JSON.parse(await readFile(publicOpenApiPath(SAMPLE), "utf8")) as Record<string, unknown>;
    expect(openapi.openapi).toBe("3.1.0");
    const paths = openapi.paths as Record<string, unknown>;
    expect(paths["/api/actions/echo"]).toBeDefined();
    // Private action must not appear.
    expect(paths["/api/actions/admin_delete"]).toBeUndefined();

    const tools = JSON.parse(await readFile(publicToolsJsonPath(SAMPLE), "utf8")) as { tools: unknown[] };
    expect(tools.tools).toHaveLength(1);
  });
});

describe("runtime handlers — Capability plane", () => {
  const originalCwd = process.cwd();
  it("serves openapi.json, tools.json, and invokes actions", async () => {
    await runBuild({ cwd: SAMPLE, config: inlineConfig(), silent: true });
    invalidateGraphCache();
    invalidateManifestCache();
    process.chdir(SAMPLE);
    try {
      const openapiResp = await openApiGET(new Request("https://x/api/openapi.json"));
      expect(openapiResp.status).toBe(200);
      expect(await openapiResp.json()).toMatchObject({ openapi: "3.1.0" });

      const toolsResp = await toolsGET(new Request("https://x/api/tools.json"));
      expect(toolsResp.status).toBe(200);
      const toolsBody = (await toolsResp.json()) as { tools: unknown[] };
      expect(toolsBody.tools).toHaveLength(1);

      // Successful invocation.
      const okResp = await actionPOST(
        new Request("https://x/api/actions/echo", {
          method: "POST",
          body: JSON.stringify({ msg: "hello" }),
        }),
        { params: Promise.resolve({ name: "echo" }) },
      );
      expect(okResp.status).toBe(200);
      const okBody = (await okResp.json()) as { ok: boolean; data: { echo: string } };
      expect(okBody).toEqual({ ok: true, data: { echo: "hello" } });
      expect(okResp.headers.get("x-action")).toBe("echo");

      // Invalid input → 400.
      const badResp = await actionPOST(
        new Request("https://x/api/actions/echo", { method: "POST", body: JSON.stringify({ msg: "" }) }),
        { params: Promise.resolve({ name: "echo" }) },
      );
      expect(badResp.status).toBe(400);
      expect(((await badResp.json()) as { code: string }).code).toBe("invalid_input");

      // Private action hidden as 404.
      const privateResp = await actionPOST(
        new Request("https://x/api/actions/admin_delete", { method: "POST", body: JSON.stringify({ id: "1" }) }),
        { params: Promise.resolve({ name: "admin_delete" }) },
      );
      expect(privateResp.status).toBe(404);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
