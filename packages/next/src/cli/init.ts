import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

/**
 * `next-ai-ready init` — codemod that writes one-line re-export handler
 * files into the user's `app/` directory (ADR-007). Each file is small,
 * readable, and customisable.
 */
export interface InitOptions {
  cwd?: string;
  /** Overwrite existing handler files. */
  force?: boolean;
  silent?: boolean;
}

interface FileSpec {
  relPath: string;
  contents: string;
}

const FILES: FileSpec[] = [
  {
    relPath: "ai-ready.config.mjs",
    contents: `import { defineConfig } from "@next-ai-ready/core";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com",
    description: "Replace this with a short description for AI search.",
  },
  content: ["app/**/*.{md,mdx}", "content/**/*.mdx"],
  // Path resolved relative to this config file. The default export of the
  // referenced module should be an array of \`defineAction(...)\` entries.
  actions: "./actions/index.mjs",
});
`,
  },
  {
    relPath: "app/_ai-ready/llms-txt/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/llms-txt";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/_ai-ready/llms-full/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/llms-full";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/_ai-ready/md/[...path]/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/page-md";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/_ai-ready/ai-json/[...path]/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/page-ai-json";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/_ai-ready/openapi/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/openapi";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/_ai-ready/tools/route.ts",
    contents: `export { GET } from "@next-ai-ready/next/handlers/tools";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/api/actions/[name]/route.ts",
    // The side-effect import populates the action registry from userland.
    // Authors edit \`actions/index.ts\` and never touch this file.
    contents: `import "@/actions";
export { POST } from "@next-ai-ready/next/handlers/action";
export const runtime = "nodejs";
`,
  },
  {
    relPath: "app/api/mcp/[transport]/route.ts",
    // Production MCP server (Streamable HTTP) at /api/mcp. Requires the
    // optional peer deps \`mcp-handler\` + \`@modelcontextprotocol/sdk\`.
    // See ADR-009 for why this is /api/mcp and not /_next/mcp.
    contents: `import "@/actions";
import { createAiReadyMcpHandler } from "@next-ai-ready/next/handlers/mcp";

const handler = await createAiReadyMcpHandler();

export { handler as GET, handler as POST, handler as DELETE };
export const runtime = "nodejs";
`,
  },
  {
    relPath: "actions/index.mjs",
    contents: `import { defineActions, defineAction } from "@next-ai-ready/actions";
import { z } from "zod";

/**
 * AI-callable actions. Each entry is also exposed at
 *   POST /api/actions/<name>
 * and surfaced in /api/openapi.json + /api/tools.json.
 *
 * Set \`public: true\` to expose. \`defineActions\` registers them into the
 * per-process registry; the array export is also used by the build CLI.
 */
export default defineActions([
  defineAction({
    name: "ping",
    description: "Health check that echoes the input.",
    whenToUse: "Sanity-test AI tool wiring before adding real actions.",
    public: true,
    input: z.object({ msg: z.string().optional() }),
    output: z.object({ ok: z.literal(true), echo: z.string() }),
    handler: async ({ msg }) => ({ ok: true, echo: msg ?? "pong" }),
  }),
]);
`,
  },
];

export interface InitResult {
  written: string[];
  skipped: string[];
}

export async function runInit(opts: InitOptions = {}): Promise<InitResult> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const log = (msg: string) => {
    if (!opts.silent) console.log(`[next-ai-ready] ${msg}`);
  };

  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of FILES) {
    const path = join(cwd, file.relPath);
    if (!opts.force && (await exists(path))) {
      skipped.push(file.relPath);
      continue;
    }
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.contents, "utf8");
    written.push(file.relPath);
  }

  log(`wrote ${written.length} files, skipped ${skipped.length} existing`);
  if (skipped.length > 0) log(`(use --force to overwrite)`);
  return { written, skipped };
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
