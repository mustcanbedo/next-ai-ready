import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectRegistryRelease,
  waitForRegistryRelease,
} from "./verify-npm-release.mjs";

const packages = [
  { name: "next-ai-ready", version: "0.1.0-alpha.20" },
  { name: "@next-ai-ready/mcp", version: "0.1.0-alpha.17" },
];

function registry(version, { alpha = version, latest = version } = {}) {
  return {
    versions: { [version]: {} },
    "dist-tags": { alpha, latest },
  };
}

test("reports missing versions and incorrect alpha or latest tags", () => {
  const manifests = new Map([
    ["next-ai-ready", registry("0.1.0-alpha.19")],
    ["@next-ai-ready/mcp", registry("0.1.0-alpha.17", { alpha: "0.1.0-alpha.16" })],
  ]);

  assert.deepEqual(inspectRegistryRelease(packages, manifests, { requireLatest: true }), [
    "next-ai-ready: version 0.1.0-alpha.20 is not visible",
    "next-ai-ready: alpha is 0.1.0-alpha.19, expected 0.1.0-alpha.20",
    "next-ai-ready: latest is 0.1.0-alpha.19, expected 0.1.0-alpha.20",
    "@next-ai-ready/mcp: alpha is 0.1.0-alpha.16, expected 0.1.0-alpha.17",
  ]);
});

test("retries until npm metadata and tags converge", async () => {
  let clock = 0;
  let reads = 0;
  const retries = [];
  const result = await waitForRegistryRelease(packages, {
    fetchManifest: async (name) => {
      reads += 1;
      if (reads <= packages.length) return null;
      const pkg = packages.find((candidate) => candidate.name === name);
      return registry(pkg.version);
    },
    requireLatest: true,
    timeoutMs: 100,
    intervalMs: 10,
    now: () => clock,
    sleep: async (delay) => { clock += delay; },
    onRetry: ({ attempts }) => retries.push(attempts),
  });

  assert.deepEqual(result, { attempts: 2 });
  assert.deepEqual(retries, [1]);
});

test("fails with actionable diagnostics after the timeout", async () => {
  let clock = 0;
  await assert.rejects(
    waitForRegistryRelease(packages, {
      fetchManifest: async () => null,
      timeoutMs: 10,
      intervalMs: 10,
      now: () => clock,
      sleep: async (delay) => { clock += delay; },
    }),
    /next-ai-ready: registry metadata unavailable/,
  );
});
