import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction, defineActions } from "../src/index.js";
import { clearRegistry, getAction, listActions } from "../src/registry.js";
import { buildActionsManifest } from "../src/manifest.js";
import { invokeAction } from "../src/invoke.js";

const dummyReq = new Request("https://x/test");

beforeEach(() => clearRegistry());

describe("defineAction()", () => {
  it("rejects non-snake_case names", () => {
    expect(() =>
      defineAction({
        name: "SearchProducts",
        description: "x",
        whenToUse: "y",
        input: z.object({}),
        handler: async () => ({}),
      }),
    ).toThrow(/snake_case/);
  });

  it("returns the definition unchanged for valid input", () => {
    const a = defineAction({
      name: "ping",
      description: "x",
      whenToUse: "y",
      input: z.object({}),
      handler: async () => ({ ok: true }),
    });
    expect(a.name).toBe("ping");
  });
});

describe("registry", () => {
  it("defineActions registers + returns the array", () => {
    const actions = defineActions([
      defineAction({ name: "a", description: "x", whenToUse: "y", input: z.object({}), handler: async () => ({}) }),
      defineAction({ name: "b", description: "x", whenToUse: "y", input: z.object({}), handler: async () => ({}) }),
    ]);
    expect(actions).toHaveLength(2);
    expect(listActions().map((a) => a.name)).toEqual(["a", "b"]);
    expect(getAction("a")).toBeDefined();
  });

  it("rejects duplicate names", () => {
    defineActions([defineAction({ name: "dup", description: "", whenToUse: "", input: z.object({}), handler: async () => ({}) })]);
    expect(() =>
      defineActions([defineAction({ name: "dup", description: "", whenToUse: "", input: z.object({}), handler: async () => ({}) })]),
    ).toThrow(/Duplicate/);
  });
});

describe("buildActionsManifest()", () => {
  it("emits JSON Schema + metadata sorted by name", () => {
    defineActions([
      defineAction({
        name: "search",
        description: "Search the catalogue.",
        whenToUse: "When user asks to find a product.",
        public: true,
        tags: ["catalog"],
        input: z.object({ query: z.string().min(1) }),
        output: z.object({ items: z.array(z.string()) }),
        handler: async () => ({ items: [] }),
      }),
      defineAction({
        name: "add_to_cart",
        description: "Add an item to the cart.",
        whenToUse: "Once the user picks a product.",
        public: false,
        input: z.object({ sku: z.string() }),
        handler: async () => ({}),
      }),
    ]);
    const manifest = buildActionsManifest();
    expect(manifest.actions.map((a) => a.name)).toEqual(["add_to_cart", "search"]);
    const search = manifest.actions.find((a) => a.name === "search")!;
    expect(search.public).toBe(true);
    expect(search.inputSchema).toMatchObject({
      type: "object",
      properties: { query: { type: "string", minLength: 1 } },
      required: ["query"],
    });
    expect(search.outputSchema).toBeDefined();
    expect(search.whenToUse).toContain("product");
  });
});

describe("invokeAction()", () => {
  it("returns 404 for unknown actions", async () => {
    const r = await invokeAction("missing", {}, dummyReq);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(404);
  });

  it("hides non-public actions as 404 (not 403)", async () => {
    defineActions([
      defineAction({
        name: "secret",
        description: "",
        whenToUse: "",
        input: z.object({}),
        handler: async () => ({}),
      }),
    ]);
    const r = await invokeAction("secret", {}, dummyReq);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("not_public");
  });

  it("validates input and returns 400 with details on failure", async () => {
    defineActions([
      defineAction({
        name: "echo",
        description: "",
        whenToUse: "",
        public: true,
        input: z.object({ msg: z.string().min(3) }),
        handler: async ({ msg }) => ({ msg }),
      }),
    ]);
    const r = await invokeAction("echo", { msg: "hi" }, dummyReq);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("invalid_input");
      expect(r.details).toBeDefined();
    }
  });

  it("calls auth hook and returns 401 when denied", async () => {
    defineActions([
      defineAction({
        name: "gated",
        description: "",
        whenToUse: "",
        public: true,
        auth: async (req) => req.headers.get("x-key") === "letmein",
        input: z.object({}),
        handler: async () => ({}),
      }),
    ]);
    const denied = await invokeAction("gated", {}, new Request("https://x"));
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe("unauthorized");

    const allowed = await invokeAction(
      "gated",
      {},
      new Request("https://x", { headers: { "x-key": "letmein" } }),
    );
    expect(allowed.ok).toBe(true);
  });

  it("invokes the handler and wraps the result", async () => {
    defineActions([
      defineAction({
        name: "add",
        description: "",
        whenToUse: "",
        public: true,
        input: z.object({ a: z.number(), b: z.number() }),
        handler: async ({ a, b }) => ({ sum: a + b }),
      }),
    ]);
    const r = await invokeAction("add", { a: 2, b: 3 }, dummyReq);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({ sum: 5 });
      expect(r.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("catches handler exceptions and returns 500", async () => {
    defineActions([
      defineAction({
        name: "boom",
        description: "",
        whenToUse: "",
        public: true,
        input: z.object({}),
        handler: async () => {
          throw new Error("kaboom");
        },
      }),
    ]);
    const r = await invokeAction("boom", {}, dummyReq);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(500);
      expect(r.message).toBe("kaboom");
    }
  });
});
