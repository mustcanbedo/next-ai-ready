import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { registerAiReady, type McpServerLike } from "@next-ai-ready/mcp";
import { loadConfig } from "./load-config.js";
import { loadGraph } from "../runtime/graph-loader.js";

export interface McpStdioOptions {
  cwd?: string;
  /** Skip registering graph pages as resources. */
  noResources?: boolean;
}

/**
 * Run an MCP server over stdio — for local clients (Claude Desktop, Cursor,
 * the MCP Inspector) that spawn a child process and speak JSON-RPC over
 * stdin/stdout.
 *
 * Unlike the HTTP handler, this is a long-lived process started from the CLI,
 * so it owns the full lifecycle: load config → populate the action registry
 * from the configured module → connect a `StdioServerTransport`.
 *
 * `@modelcontextprotocol/sdk` is a peer dependency, imported dynamically so
 * `next-ai-ready build/init` work without it; only `mcp` needs it.
 */
export async function runMcpStdio(opts: McpStdioOptions = {}): Promise<void> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const config = await loadConfig(cwd);
  if (!config) {
    throw new Error(
      "[next-ai-ready] No ai-ready.config.mjs found. Run `next-ai-ready init` first.",
    );
  }

  // Populate the registry from the configured actions module (or inline array).
  if (typeof config.actions === "string") {
    const modPath = resolve(cwd, config.actions);
    await import(pathToFileURL(modPath).href);
  } else if (Array.isArray(config.actions)) {
    const { registerActions } = await import("@next-ai-ready/actions");
    registerActions(config.actions);
  }

  const { McpServer } = await importSdkServer();
  const { StdioServerTransport } = await importSdkStdio();

  const server = new McpServer({
    name: config.site.name || "next-ai-ready",
    version: "0.0.0",
  });

  const graph = opts.noResources ? undefined : await loadGraph(cwd).catch(() => undefined);
  const counts = registerAiReady(server as unknown as McpServerLike, { graph });

  // Diagnostics go to stderr — stdout is reserved for the JSON-RPC stream.
  process.stderr.write(
    `[next-ai-ready] MCP stdio server ready — ${counts.tools} tools, ${counts.resources} resources\n`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importSdkServer(): Promise<{ McpServer: any }> {
  try {
    const spec = "@modelcontextprotocol/sdk/server/mcp.js";
    return (await import(/* @vite-ignore */ spec)) as never;
  } catch {
    throw new Error(
      "[next-ai-ready] The MCP stdio server requires `@modelcontextprotocol/sdk`. " +
        "Install it: `npm i @modelcontextprotocol/sdk`.",
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importSdkStdio(): Promise<{ StdioServerTransport: any }> {
  const spec = "@modelcontextprotocol/sdk/server/stdio.js";
  return (await import(/* @vite-ignore */ spec)) as never;
}
