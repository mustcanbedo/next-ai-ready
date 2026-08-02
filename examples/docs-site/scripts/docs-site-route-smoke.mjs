#!/usr/bin/env node

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.DOCS_SITE_SMOKE_PORT ?? 3100);
const ORIGIN = `http://${HOST}:${PORT}`;
const START_TIMEOUT_MS = 30_000;
const NEXT_BIN = join(ROOT, "node_modules/next/dist/bin/next");
const MCP_TOKEN = "next-ai-ready-docs-site-smoke-token";

const server = spawn(
  process.execPath,
  [NEXT_BIN, "start", "--hostname", HOST, "--port", String(PORT)],
  {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "production", NEXT_AI_READY_MCP_TOKEN: MCP_TOKEN },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk;
});
server.stderr.on("data", (chunk) => {
  output += chunk;
});

function fail(message) {
  throw new Error(`${message}\n\nNext.js output:\n${output.trim()}`);
}

async function waitForServer() {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) fail(`Next.js exited with code ${server.exitCode}`);
    try {
      const response = await fetch(`${ORIGIN}/en`, { redirect: "manual" });
      if (response.status === 200) return;
    } catch {
      // The socket is expected to fail while Next.js is starting.
    }
    await delay(250);
  }
  fail(`Next.js did not become ready within ${START_TIMEOUT_MS}ms`);
}

async function expectResponse(
  path,
  { contentType, headerIncludes = {}, includes, requestHeaders, status = 200 },
) {
  const response = await fetch(`${ORIGIN}${path}`, {
    headers: requestHeaders,
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== status) {
    fail(`${path}: expected ${status}, received ${response.status}`);
  }
  if (contentType && !response.headers.get("content-type")?.includes(contentType)) {
    fail(`${path}: expected content-type containing ${contentType}`);
  }
  if (includes && !body.includes(includes)) {
    fail(`${path}: response body is missing ${JSON.stringify(includes)}`);
  }
  for (const [name, expected] of Object.entries(headerIncludes)) {
    if (!response.headers.get(name)?.includes(expected)) {
      fail(`${path}: expected ${name} header containing ${JSON.stringify(expected)}`);
    }
  }

  console.log(`  ok ${path} (${response.status})`);
}

async function callMcp(id, method, params) {
  const response = await fetch(`${ORIGIN}/api/mcp/mcp`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${MCP_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  const body = await response.text();
  if (response.status !== 200 || body.includes('"isError":true')) {
    fail(`MCP ${method}: expected success, received ${response.status}: ${body}`);
  }
  return body;
}

async function main() {
  console.log(`[docs-site-route-smoke] starting ${ORIGIN}`);
  await waitForServer();

  await expectResponse("/llms.txt", {
    contentType: "text/plain",
    includes: "# next-ai-ready",
  });
  await expectResponse("/sitemap.md", {
    contentType: "text/markdown",
    includes: "# next-ai-ready Sitemap",
  });
  await expectResponse("/_ai-ready/llms-txt", {
    contentType: "text/plain",
    includes: "# next-ai-ready",
  });
  await expectResponse("/en.md", {
    contentType: "text/markdown",
    headerIncludes: {
      link: '<https://next-ai-ready.vercel.app/en>; rel="canonical"',
    },
    includes: "# next-ai-ready",
  });
  await expectResponse("/zh.md", {
    contentType: "text/markdown",
    includes: "# next-ai-ready",
  });
  await expectResponse("/en", {
    contentType: "text/markdown",
    includes: "# next-ai-ready",
    requestHeaders: { accept: "text/markdown" },
  });
  await expectResponse("/en", {
    contentType: "text/markdown",
    includes: "# next-ai-ready",
    requestHeaders: { "user-agent": "Vercel-Agent/1.0" },
  });
  await expectResponse("/en/docs/introduction.md", {
    contentType: "text/markdown",
    headerIncludes: {
      link: '<https://next-ai-ready.vercel.app/en/docs/introduction>; rel="canonical"',
    },
    includes: "# Introduction",
  });
  await expectResponse("/zh/docs/introduction.md", {
    contentType: "text/markdown",
    includes: "# ",
  });
  await expectResponse("/en/docs/guides/nextjs-llms-txt", {
    contentType: "text/html",
    includes: "How to add llms.txt to Next.js",
  });
  await expectResponse("/en/docs/guides/nextjs-llms-txt.md", {
    contentType: "text/markdown",
    includes: "# How to add llms.txt to Next.js",
  });
  await expectResponse("/zh/docs/guides/nextjs-llms-txt.md", {
    contentType: "text/markdown",
    includes: "# 如何为 Next.js 添加 llms.txt",
  });
  await expectResponse("/en/docs/guides/nextra-ai-ready", {
    contentType: "text/html",
    includes: "Nextra llms.txt and Markdown endpoint setup",
  });
  await expectResponse("/en/docs/guides/nextra-ai-ready.md", {
    contentType: "text/markdown",
    includes: "# Nextra llms.txt and Markdown endpoint setup",
  });
  await expectResponse("/zh/docs/guides/fumadocs-ai-ready.md", {
    contentType: "text/markdown",
    includes: "# 为 Fumadocs 添加 llms.txt 与 Markdown 端点",
  });
  await expectResponse("/en/docs/introduction.ai.json", {
    contentType: "application/json",
    includes: '"route": "/en/docs/introduction"',
  });
  await expectResponse("/en/docs/introduction", {
    contentType: "text/html",
    headerIncludes: { vary: "Accept" },
    includes: "text/markdown",
  });
  await expectResponse("/en/docs/introduction", {
    contentType: "text/markdown",
    includes: "# Introduction",
    requestHeaders: { accept: "text/markdown" },
  });
  await expectResponse("/en/docs/introduction", {
    contentType: "text/markdown",
    includes: "# Introduction",
    requestHeaders: { "user-agent": "Vercel-Agent/1.0" },
  });
  await expectResponse("/en/docs/does-not-exist.md", {
    status: 200,
    contentType: "text/markdown",
    headerIncludes: { "x-robots-tag": "noindex" },
    includes: "document_status: \"not_found\"",
  });
  await expectResponse("/en/docs/does-not-exist", {
    status: 200,
    contentType: "text/markdown",
    headerIncludes: { "x-robots-tag": "noindex" },
    includes: "document_status: \"not_found\"",
    requestHeaders: { accept: "text/markdown" },
  });
  await expectResponse("/en/docs/does-not-exist", {
    status: 404,
    contentType: "text/html",
    requestHeaders: { accept: "text/html" },
  });

  const unauthorizedMcp = await fetch(`${ORIGIN}/api/mcp/mcp`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 0, method: "tools/list", params: {} }),
  });
  if (unauthorizedMcp.status !== 401) {
    fail(`MCP without a token: expected 401, received ${unauthorizedMcp.status}`);
  }
  console.log("  ok MCP rejects missing bearer token (401)");
  const initialized = await callMcp(1, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "docs-site-smoke", version: "1.0.0" },
  });
  if (!initialized.includes('"protocolVersion":"2025-03-26"')) {
    fail("MCP initialize response is missing the negotiated protocol version");
  }
  const listed = await callMcp(2, "tools/call", {
    name: "list_pages",
    arguments: { limit: 2 },
  });
  if (!listed.includes("/en")) fail("MCP list_pages did not return a page route");
  const searched = await callMcp(3, "tools/call", {
    name: "search_pages",
    arguments: { query: "installation", limit: 1 },
  });
  if (!searched.includes("/en/docs/installation")) {
    fail("MCP search_pages did not rank the English installation page first");
  }
  const page = await callMcp(4, "tools/call", {
    name: "get_page",
    arguments: { route: "/en/docs/installation" },
  });
  if (!page.includes("0.1.0-alpha.16")) {
    fail("MCP get_page did not return the current installation content");
  }
  const frameworkGuide = await callMcp(5, "tools/call", {
    name: "search_pages",
    arguments: { query: "Nextra llms.txt", locale: "en", limit: 1 },
  });
  if (!frameworkGuide.includes("/en/docs/guides/nextra-ai-ready")) {
    fail("MCP search_pages did not rank the Nextra compatibility guide first");
  }
  console.log("  ok MCP auth, initialize, list_pages, search_pages, get_page");

  console.log("[docs-site-route-smoke] ALL CHECKS PASSED");
}

try {
  await main();
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      delay(5_000).then(() => server.kill("SIGKILL")),
    ]);
  }
}
