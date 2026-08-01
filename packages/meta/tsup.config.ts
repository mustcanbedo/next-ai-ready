import { defineConfig } from 'tsup'

const handlers = [
  'llms-txt',
  'llms-full',
  'page-md',
  'page-ai-json',
  'openapi',
  'tools',
  'action',
  'mcp',
  'ai-plugin',
]

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/audit.ts', 'src/hooks.ts', ...handlers.map((h) => `src/handlers/${h}.ts`)],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
})
