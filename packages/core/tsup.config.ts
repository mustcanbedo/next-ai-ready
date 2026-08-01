import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/scanner-entry.ts', 'src/bots-entry.ts', 'src/json.ts', 'src/robots.ts', 'src/url.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
})
