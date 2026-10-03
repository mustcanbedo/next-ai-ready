/* global Response, URL */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runProductionContractCheck } from "./production-contract-check.mjs";

async function fixtureRoot(t, version = "0.1.0-alpha.20") {
  const root = await mkdtemp(join(tmpdir(), "production-contract-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const packageDir = join(root, "packages", "meta");
  await mkdir(packageDir, { recursive: true });
  await writeFile(join(packageDir, "package.json"), JSON.stringify({ version }));
  return root;
}

function response(body, init = {}) {
  return new Response(body, { status: 200, ...init });
}

function passingFetch(url, options = {}, label = "alpha.20") {
  const path = new URL(url).pathname;
  if (path === "/en") return Promise.resolve(response(label));
  if (path === "/sitemap.xml") {
    return Promise.resolve(response("<urlset><loc>https://nextaiready.com/en</loc></urlset>"));
  }
  if (options.headers?.accept === "text/markdown") {
    return Promise.resolve(
      response('document_status: "not_found"', { headers: { "x-robots-tag": "noindex" } }),
    );
  }
  return Promise.resolve(response("missing", { status: 404 }));
}

test("accepts a current deployment with correct browser and agent semantics", async (t) => {
  const root = await fixtureRoot(t);
  const result = await runProductionContractCheck({ root, fetchImpl: passingFetch });
  assert.equal(result.expectedVersion, "0.1.0-alpha.20");
});

test("rejects a stale production deployment", async (t) => {
  const root = await fixtureRoot(t);
  const fetchImpl = (url, options) => {
    if (new URL(url).pathname === "/en") return Promise.resolve(response("alpha.18"));
    return passingFetch(url, options);
  };
  await assert.rejects(
    runProductionContractCheck({ root, fetchImpl }),
    /production may be stale/,
  );
});

test("rejects a nested HTML route that returns 500", async (t) => {
  const root = await fixtureRoot(t);
  const fetchImpl = (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path.includes("production-contract-missing-page") && options.headers?.accept === "text/html") {
      return Promise.resolve(response("error", { status: 500 }));
    }
    return passingFetch(url, options);
  };
  await assert.rejects(runProductionContractCheck({ root, fetchImpl }), /returned 500 for HTML/);
});

for (const [version, label] of [["0.1.0-alpha.22", "alpha.22"], ["0.1.0", "0.1.0"]]) {
  test(`accepts ${version} independently of the repository release`, async (t) => {
    const root = await fixtureRoot(t, version);
    const result = await runProductionContractCheck({
      root,
      fetchImpl: (url, options) => passingFetch(url, options, label),
    });
    assert.equal(result.expectedVersion, version);
  });
}
