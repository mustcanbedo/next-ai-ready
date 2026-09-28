#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const NEXT_BIN = join(ROOT, "node_modules/next/dist/bin/next");
const START_TIMEOUT_MS = 45_000;

async function availablePort() {
  return new Promise((resolve, reject) => {
    const socket = createServer();
    socket.once("error", reject);
    socket.listen(0, HOST, () => {
      const address = socket.address();
      socket.close(() => resolve(address.port));
    });
  });
}

async function expectResponse(origin, path, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    headers: options.headers,
    redirect: "manual",
  });
  const body = await response.text();

  assert.equal(response.status, options.status ?? 200, `${path} status`);
  if (options.contentType) {
    assert.match(response.headers.get("content-type") ?? "", options.contentType, `${path} content-type`);
  }
  for (const fragment of options.includes ?? []) {
    assert.ok(body.includes(fragment), `${path} should include ${JSON.stringify(fragment)}`);
  }
  for (const [name, fragment] of Object.entries(options.headerIncludes ?? {})) {
    assert.ok(
      response.headers.get(name)?.includes(fragment),
      `${path} ${name} should include ${JSON.stringify(fragment)}`,
    );
  }

  console.log(`  ok ${path} (${response.status})`);
}

async function main() {
  const graph = JSON.parse(await readFile(join(ROOT, ".next-ai-ready/graph.json"), "utf8"));
  const routes = Object.values(graph.nodes)
    .filter((node) => node.kind === "page")
    .map((node) => node.route)
    .sort();
  assert.deepEqual(routes, ["/", "/getting-started"]);
  console.log("  ok one MDX collection feeds the Nextra UI and next-ai-ready graph");

  const port = await availablePort();
  const origin = `http://${HOST}:${port}`;
  const server = spawn(process.execPath, [NEXT_BIN, "start", "--hostname", HOST, "--port", String(port)], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });

  try {
    const deadline = Date.now() + START_TIMEOUT_MS;
    let ready = false;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) {
        throw new Error(`Next.js exited with ${server.exitCode}\n${output}`);
      }
      try {
        const response = await fetch(origin, { redirect: "manual" });
        if (response.status === 200) {
          ready = true;
          break;
        }
      } catch {
        // The socket is expected to reject connections during startup.
      }
      await delay(250);
    }
    if (!ready) {
      throw new Error(`Next.js did not become ready within ${START_TIMEOUT_MS}ms\n${output}`);
    }

    await expectResponse(origin, "/", {
      contentType: /text\/html/,
      includes: ["Nextra AI-ready fixture", "Getting started"],
    });
    await expectResponse(origin, "/getting-started", {
      contentType: /text\/html/,
      includes: ["Install the public package", "Nextra + next-ai-ready"],
      headerIncludes: { vary: "Accept" },
    });
    await expectResponse(origin, "/llms.txt", {
      contentType: /text\/plain/,
      includes: [
        "# Nextra AI-ready fixture",
        "https://nextra-fixture.example/getting-started",
      ],
    });
    await expectResponse(origin, "/llms-full.txt", {
      contentType: /text\/plain/,
      includes: ["# Getting started", "Does next-ai-ready replace Nextra?"],
    });
    await expectResponse(origin, "/getting-started.md", {
      contentType: /text\/markdown/,
      includes: ["# Getting started", "pnpm add next-ai-ready"],
      headerIncludes: { link: '<https://nextra-fixture.example/getting-started>; rel="canonical"' },
    });
    await expectResponse(origin, "/getting-started.ai.json", {
      contentType: /application\/json/,
      includes: ['"route": "/getting-started"'],
    });
    await expectResponse(origin, "/getting-started", {
      headers: { accept: "text/markdown" },
      contentType: /text\/markdown/,
      includes: ["# Getting started"],
    });
    await expectResponse(origin, "/does-not-exist", {
      headers: { accept: "text/html" },
      status: 404,
      contentType: /text\/html/,
    });
    await expectResponse(origin, "/does-not-exist", {
      headers: { accept: "text/markdown" },
      status: 200,
      contentType: /text\/markdown/,
      includes: ['document_status: "not_found"'],
      headerIncludes: { "x-robots-tag": "noindex" },
    });

    console.log("[nextra-compatibility] all production checks passed");
  } finally {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      delay(5_000).then(() => server.kill("SIGKILL")),
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
