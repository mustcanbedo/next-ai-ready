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

const server = spawn(
  process.execPath,
  [NEXT_BIN, "start", "--hostname", HOST, "--port", String(PORT)],
  {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "production" },
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
  await expectResponse("/en/docs/does-not-exist.md", { status: 404 });

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
