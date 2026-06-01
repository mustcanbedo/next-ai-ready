import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/scanner-entry.ts', 'src/bots-entry.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
})
