import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  defineAction,
  defineActions,
  clearRegistry,
  buildActionsManifest,
} from "@next-ai-ready/actions";
import { buildOpenApi } from "../src/openapi.js";
import { buildToolsJson } from "../src/tools.js";
import { buildAiPlugin } from "../src/ai-plugin.js";

const SITE = {
  name: "Acme",
  baseUrl: "https://acme.com",
  description: "Acme commerce.",
};

beforeEach(() => clearRegistry());

function seed() {
  defineActions([
    defineAction({
      name: "search_products",
      description: "Full-text search across the catalogue.",
      whenToUse: "When the user asks to find a product by name or feature.",
      whenNotToUse: "When the user wants to check order status.",
      public: true,
      tags: ["catalog"],
      input: z.object({ query: z.string().min(1), limit: z.number().int().optional() }),
      output: z.object({ items: z.array(z.object({ id: z.string(), title: z.string() })) }),
      handler: async ({ query }) => ({ items: [{ id: "1", title: query }] }),
    }),
    defineAction({
      name: "internal_reindex",
      description: "Rebuilds the search index.",
      whenToUse: "Never expose this.",
      public: false,
      input: z.object({}),
      handler: async () => ({ ok: true }),
    }),
  ]);
  return buildActionsManifest();
}

describe("buildOpenApi()", () => {
  it("emits OpenAPI 3.1 with only public actions as POST operations", () => {
    const doc = buildOpenApi(seed(), SITE) as Record<string, unknown>;
    expect(doc.openapi).toBe("3.1.0");
    const paths = doc.paths as Record<string, unknown>;
    expect(paths["/api/actions/search_products"]).toBeDefined();
    expect(paths["/api/actions/internal_reindex"]).toBeUndefined();

    const op = (paths["/api/actions/search_products"] as { post: Record<string, unknown> }).post;
    expect(op.operationId).toBe("search_products");
    expect(op.summary).toBe("Full-text search across the catalogue.");
    expect(op["x-ai-when-to-use"]).toContain("find a product");
    expect(op["x-ai-when-not-to-use"]).toContain("order status");
    expect(op.tags).toEqual(["catalog"]);
  });

  it("inlines the input schema in requestBody and output schema in 200", () => {
    const doc = buildOpenApi(seed(), SITE) as Record<string, unknown>;
    const op = (doc.paths as Record<string, { post: Record<string, unknown> }>)["/api/actions/search_products"].post;
    const body = (op.requestBody as { content: Record<string, { schema: Record<string, unknown> }> }).content["application/json"].schema;
    expect(body.type).toBe("object");
    expect((body.properties as Record<string, unknown>).query).toMatchObject({ type: "string", minLength: 1 });

    const resp = (op.responses as Record<string, { content: Record<string, { schema: Record<string, unknown> }> }>)["200"];
    expect(resp.content["application/json"].schema.type).toBe("object");
  });

  it("respects custom basePath", () => {
    const doc = buildOpenApi(seed(), SITE, { basePath: "/ai/tools" }) as Record<string, unknown>;
    expect((doc.paths as Record<string, unknown>)["/ai/tools/search_products"]).toBeDefined();
  });

  it("uses the site baseUrl as the first server", () => {
    const doc = buildOpenApi(seed(), SITE) as Record<string, unknown>;
    expect((doc.servers as { url: string }[])[0].url).toBe("https://acme.com");
  });
});

describe("buildToolsJson()", () => {
  it("folds whenToUse + whenNotToUse into description for OpenAI tool format", () => {
    const tools = buildToolsJson(seed(), SITE).tools;
    expect(tools).toHaveLength(1); // private action excluded
    const t = tools[0] as { type: string; function: { name: string; description: string; parameters: Record<string, unknown> } };
    expect(t.type).toBe("function");
    expect(t.function.name).toBe("search_products");
    expect(t.function.description).toContain("Full-text search");
    expect(t.function.description).toContain("Use when:");
    expect(t.function.description).toContain("Do not use when:");
    expect(t.function.parameters.type).toBe("object");
  });
});

describe("buildAiPlugin()", () => {
  it("produces a v1 ai-plugin.json pointing to /api/openapi.json by default", () => {
    const plugin = buildAiPlugin(SITE) as Record<string, unknown>;
    expect(plugin.schema_version).toBe("v1");
    expect(plugin.name_for_human).toBe("Acme");
    expect(plugin.name_for_model).toBe("acme");
    expect((plugin.api as Record<string, string>).url).toBe("https://acme.com/api/openapi.json");
  });

  it("respects custom openapiPath + logoUrl", () => {
    const plugin = buildAiPlugin(SITE, {
      openapiPath: "/well-known/openapi.json",
      logoUrl: "https://cdn.acme.com/logo.png",
    }) as Record<string, unknown>;
    expect((plugin.api as Record<string, string>).url).toBe("https://acme.com/well-known/openapi.json");
    expect(plugin.logo_url).toBe("https://cdn.acme.com/logo.png");
  });
});
