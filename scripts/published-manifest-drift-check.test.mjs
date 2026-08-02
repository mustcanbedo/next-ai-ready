import assert from "node:assert/strict";
import test from "node:test";
import {
  findManifestDrift,
  normalizeLocalManifest,
  normalizePublishedManifest,
} from "./published-manifest-drift-check.mjs";

test("normalizes workspace dependency ranges to publishable versions", () => {
  const manifest = normalizeLocalManifest(
    {
      dependencies: {
        exact: "workspace:*",
        compatible: "workspace:^",
        external: "^4.0.0",
      },
    },
    new Map([
      ["exact", "0.1.0-alpha.12"],
      ["compatible", "0.1.0-alpha.13"],
    ]),
  );

  assert.deepEqual(manifest.dependencies, {
    exact: "0.1.0-alpha.12",
    compatible: "^0.1.0-alpha.13",
    external: "^4.0.0",
  });
});

test("detects a new subpath export on an already published version", () => {
  const local = {
    exports: {
      ".": { import: "./dist/index.js" },
      "./jsonld": { import: "./dist/jsonld.js" },
    },
  };
  const published = {
    exports: {
      ".": { import: "./dist/index.js" },
    },
  };

  assert.deepEqual(findManifestDrift(local, published), ["exports"]);
});

test("normalizes npm bin paths", () => {
  assert.deepEqual(
    normalizeLocalManifest(
      { bin: { "next-ai-ready": "./dist/cli.js" } },
      new Map(),
    ),
    { bin: { "next-ai-ready": "dist/cli.js" } },
  );
});

test("normalizes published npm bin paths before drift comparison", () => {
  const local = normalizeLocalManifest(
    { bin: { "next-ai-ready": "./dist/cli.js" } },
    new Map(),
  );
  const published = normalizePublishedManifest({
    bin: { "next-ai-ready": "./dist/cli.js" },
  });

  assert.deepEqual(findManifestDrift(local, published), []);
});

test("ignores object key ordering", () => {
  assert.deepEqual(
    findManifestDrift(
      { exports: { "./b": "b.js", "./a": "a.js" } },
      { exports: { "./a": "a.js", "./b": "b.js" } },
    ),
    [],
  );
});
