import { mkdir, writeFile, readFile, access } from "node:fs/promises";
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

const ACTIONS_REGISTER = "../../../../actions/index";

function buildFileSpecs(useTypeScript: boolean): FileSpec[] {
  const actionsExt = useTypeScript ? "ts" : "mjs";
  const actionsRel = `actions/index.${actionsExt}`;
  const configRel = useTypeScript ? "ai-ready.config.ts" : "ai-ready.config.mjs";
  const registerImport = `import "${ACTIONS_REGISTER}.${actionsExt}";\n`;

  return [
    {
      relPath: configRel,
      contents: `import { defineConfig } from "next-ai-ready";

export default defineConfig({
  site: {
    name: "My Site",
    baseUrl: "https://example.com",
    description: "Replace this with a short description for AI search.",
  },
  content: ["app/**/*.{md,mdx}", "content/**/*.mdx"],
  actions: "./${actionsRel}",
  // Robots: build emits public/robots.txt. For dynamic rules use app/robots.ts + aiRobots().
});
`,
    },
    {
      relPath: "app/%5Fai-ready/llms-txt/route.ts",
      contents: `export { GET } from "next-ai-ready/handlers/llms-txt";
export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/llms-full/route.ts",
      contents: `export { GET } from "next-ai-ready/handlers/llms-full";
export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/md/[...path]/route.ts",
      contents: `import { GET as handlePageMarkdown } from "next-ai-ready/handlers/page-md";

export async function GET(request: Request, context: any) {
  return handlePageMarkdown(request, context);
}

export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/ai-json/[...path]/route.ts",
      contents: `import { GET as handlePageAiJson } from "next-ai-ready/handlers/page-ai-json";

export async function GET(request: Request, context: any) {
  return handlePageAiJson(request, context);
}

export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/openapi/route.ts",
      contents: `export { GET } from "next-ai-ready/handlers/openapi";
export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/tools/route.ts",
      contents: `export { GET } from "next-ai-ready/handlers/tools";
export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/%5Fai-ready/ai-plugin/route.ts",
      contents: `export { GET } from "next-ai-ready/handlers/ai-plugin";
export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/api/actions/[name]/route.ts",
      contents: `${registerImport}import { POST as handleAction } from "next-ai-ready/handlers/action";

export async function POST(request: Request, context: any) {
  return handleAction(request, context);
}

export const runtime = "nodejs";
`,
    },
    {
      relPath: "app/api/mcp/[transport]/route.ts",
      contents: `${registerImport}import { createAiReadyMcpHandler } from "next-ai-ready/handlers/mcp";

let handlerPromise: ReturnType<typeof createAiReadyMcpHandler> | undefined;
function getHandler() {
  handlerPromise ??= createAiReadyMcpHandler().catch((error) => {
    handlerPromise = undefined;
    throw error;
  });
  return handlerPromise;
}

export async function GET(request: Request) {
  return (await getHandler())(request);
}

export async function POST(request: Request) {
  return (await getHandler())(request);
}

export async function DELETE(request: Request) {
  return (await getHandler())(request);
}

export const runtime = "nodejs";
`,
    },
    {
      relPath: "instrumentation.ts",
      contents: `export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
`,
    },
    {
      relPath: "instrumentation-node.ts",
      contents: `import "server-only";
import { registerAiHooks } from "next-ai-ready/hooks";

registerAiHooks({
  onAiRequest(info) {
    console.log("[ai-request]", { bot: info.bot, artifact: info.artifact, path: info.path });
  },
  onInvoke(info) {
    console.log("[ai-invoke]", { action: info.action, ok: info.ok, latencyMs: info.latencyMs });
  },
});
`,
    },
    {
      relPath: actionsRel,
      contents: `import { defineActions, defineAction } from "next-ai-ready";
import { z } from "zod";

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
}

async function prefersTypeScript(cwd: string): Promise<boolean> {
  for (const name of ["next.config.ts", "tsconfig.json"]) {
    try {
      await access(join(cwd, name));
      return true;
    } catch {
      /* continue */
    }
  }
  return false;
}

export interface InitResult {
  written: string[];
  skipped: string[];
  patched: string[];
}

export async function runInit(opts: InitOptions = {}): Promise<InitResult> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const log = (msg: string) => {
    if (!opts.silent) console.log(`[next-ai-ready] ${msg}`);
  };

  const written: string[] = [];
  const skipped: string[] = [];
  const patched: string[] = [];

  const useTypeScript = await prefersTypeScript(cwd);
  const files = buildFileSpecs(useTypeScript);

  for (const file of files) {
    const path = join(cwd, file.relPath);
    if (!opts.force && (await exists(path))) {
      skipped.push(file.relPath);
      continue;
    }
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.contents, "utf8");
    written.push(file.relPath);
  }

  // Patch existing project files (N-01, N-02).
  const configPatch = await patchNextConfig(cwd);
  if (configPatch) patched.push(configPatch);
  const pkgPatch = await patchPackageJson(cwd);
  if (pkgPatch) patched.push(pkgPatch);

  log(`wrote ${written.length} files, skipped ${skipped.length} existing`);
  if (skipped.length > 0) log(`(use --force to overwrite)`);
  if (patched.length > 0) log(`patched: ${patched.join(", ")}`);
  return { written, skipped, patched };
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// N-01: Patch next.config to include withAiReady()
// ---------------------------------------------------------------------------

const CONFIG_CANDIDATES = ["next.config.mjs", "next.config.ts", "next.config.js"];

async function patchNextConfig(cwd: string): Promise<string | null> {
  // Find existing config file.
  for (const name of CONFIG_CANDIDATES) {
    const filePath = join(cwd, name);
    if (await exists(filePath)) {
      const src = await readFile(filePath, "utf8");
      if (src.includes("withAiReady")) return null; // already configured

      const importLine = `import { withAiReady } from "next-ai-ready";\n`;

      let updated = importLine + src;
      // Pattern 1: export default <wrapper>({  or  export default ({
      updated = updated.replace(
        /export\s+default\s+(defineNextConfig\s*\(|defineConfig\s*\(|\()?\s*\{/g,
        (match, fn) => fn
          ? `export default withAiReady()(${fn}{`
          : `export default withAiReady()({`,
      );
      // Pattern 2: export default <identifier>;  (e.g. "export default config;")
      if (updated === importLine + src) {
        updated = updated.replace(
          /export\s+default\s+(\w+)\s*;/g,
          (match, id) => id === "withAiReady" ? match : `export default withAiReady()(${id});`,
        );
      }
      if (updated === importLine + src) return null; // no match, skip

      await writeFile(filePath, updated, "utf8");
      return name;
    }
  }

  // No config file found — create a minimal one.
  const newConfig = `import { withAiReady } from "next-ai-ready";

export default withAiReady()({
  // Your Next.js config here.
});
`;
  await writeFile(join(cwd, "next.config.mjs"), newConfig, "utf8");
  return "next.config.mjs (created)";
}

// ---------------------------------------------------------------------------
// N-02: Patch package.json build scripts
// ---------------------------------------------------------------------------

async function patchPackageJson(cwd: string): Promise<string | null> {
  const pkgPath = join(cwd, "package.json");
  if (!(await exists(pkgPath))) return null;

  const raw = await readFile(pkgPath, "utf8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  let changed = false;

  // Ensure `next-ai-ready build` runs before `next build`.
  const build = scripts.build ?? "";
  if (!build.includes("next-ai-ready build")) {
    scripts.build = `next-ai-ready build && ${build || "next build"}`.trim();
    changed = true;
  }

  // Add typecheck if missing.
  if (!scripts.typecheck) {
    scripts.typecheck = "tsc --noEmit";
    changed = true;
  }

  if (!changed) return null;

  pkg.scripts = scripts;
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  return "package.json";
}
