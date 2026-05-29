import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli-bin.ts",
    "src/cli/index.ts",
    "src/handlers/llms-txt.ts",
    "src/handlers/llms-full.ts",
    "src/handlers/page-md.ts",
    "src/handlers/page-ai-json.ts",
    "src/handlers/openapi.ts",
    "src/handlers/tools.ts",
    "src/handlers/action.ts",
    "src/handlers/mcp.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  // Mark workspace deps + node built-ins as external so they aren't inlined.
  external: [/^@next-ai-ready\//, "server-only"],
  banner: ({ format: _format }) => ({ js: "" }),
});
