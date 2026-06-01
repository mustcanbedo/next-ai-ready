import { describe, expect, it } from "vitest";
import { buildRoutesByLocale, parseLocaleFromRoute, stripLocaleFromRoute } from "../src/locale.js";
import { actionsModulePath } from "../src/types.js";

describe("locale (P6-06)", () => {
  it("parses locale from route prefix", () => {
    expect(parseLocaleFromRoute("/en/docs")).toBe("en");
    expect(parseLocaleFromRoute("/zh-CN/about")).toBe("zh");
    expect(parseLocaleFromRoute("/docs")).toBeUndefined();
  });

  it("builds routesByLocale index", () => {
    const byLocale = buildRoutesByLocale({
      "/en/docs": "a",
      "/zh/docs": "b",
      "/about": "c",
    });
    expect(byLocale?.en["/docs"]).toBe("a");
    expect(byLocale?.zh["/docs"]).toBe("b");
  });

  it("strips locale prefix", () => {
    expect(stripLocaleFromRoute("/en/docs", "en")).toBe("/docs");
    expect(stripLocaleFromRoute("/en", "en")).toBe("/");
  });
});

describe("actionsModulePath (C-11)", () => {
  it("brands relative paths", () => {
    expect(actionsModulePath("./actions/index.mjs")).toBe("./actions/index.mjs");
  });

  it("rejects absolute paths", () => {
    expect(() => actionsModulePath("/actions/index.mjs")).toThrow(/relative/);
  });
});
