import assert from "node:assert/strict";
import test from "node:test";
import { runProductionContractCheck } from "./production-contract-check.mjs";

function response(body, init = {}) {
  return new Response(body, { status: 200, ...init });
}

function passingFetch(url, options = {}) {
  const path = new URL(url).pathname;
  if (path === "/en") return Promise.resolve(response("alpha.19"));
  if (path === "/sitemap.xml") {
    return Promise.resolve(response("<urlset><loc>https://next-ai-ready.vercel.app/en</loc></urlset>"));
  }
  if (options.headers?.accept === "text/markdown") {
    return Promise.resolve(
      response('document_status: "not_found"', { headers: { "x-robots-tag": "noindex" } }),
    );
  }
  return Promise.resolve(response("missing", { status: 404 }));
}

test("accepts a current deployment with correct browser and agent semantics", async () => {
  const result = await runProductionContractCheck({ fetchImpl: passingFetch });
  assert.equal(result.expectedVersion, "0.1.0-alpha.19");
});

test("rejects a stale production deployment", async () => {
  const fetchImpl = (url, options) => {
    if (new URL(url).pathname === "/en") return Promise.resolve(response("alpha.18"));
    return passingFetch(url, options);
  };
  await assert.rejects(
    runProductionContractCheck({ fetchImpl }),
    /production may be stale/,
  );
});

test("rejects a nested HTML route that returns 500", async () => {
  const fetchImpl = (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path.includes("production-contract-missing-page") && options.headers?.accept === "text/html") {
      return Promise.resolve(response("error", { status: 500 }));
    }
    return passingFetch(url, options);
  };
  await assert.rejects(runProductionContractCheck({ fetchImpl }), /returned 500 for HTML/);
});
