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

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/actions.ts', 'src/config.ts', 'src/json-ld.ts', 'src/robots.ts', 'src/cli.ts', 'src/audit.ts', 'src/hooks.ts', ...handlers.map((h) => `src/handlers/${h}.ts`)],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'node20',
  },
  {
    entry: { config: 'src/config.ts' },
    format: ['cjs'],
    dts: false,
    clean: false,
    sourcemap: true,
    target: 'node20',
    outExtension: () => ({ js: '.cjs' }),
    noExternal: ['@next-ai-ready/next'],
  },
])
