import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const pkgs = [
  { name: 'core',     deps: {}, desc: 'Shared types, config, scanner, IO for next-ai-ready.' },
  { name: 'semantic', deps: { '@next-ai-ready/core': 'workspace:*' }, desc: 'SemanticGraph builder + JSON-LD emitter.' },
  { name: 'mdx',      deps: { '@next-ai-ready/core': 'workspace:*', '@next-ai-ready/semantic': 'workspace:*' }, desc: 'MDX to semantic compiler (unified pipeline).' },
  { name: 'actions',  deps: { '@next-ai-ready/core': 'workspace:*' }, desc: 'defineAction registry, Zod validation, schema emission.' },
  { name: 'llms',     deps: { '@next-ai-ready/core': 'workspace:*', '@next-ai-ready/semantic': 'workspace:*', '@next-ai-ready/mdx': 'workspace:*' }, desc: 'llms.txt / llms-full.txt / per-route Markdown generators.' },
  { name: 'openapi',  deps: { '@next-ai-ready/core': 'workspace:*', '@next-ai-ready/actions': 'workspace:*' }, desc: 'ActionRegistry to OpenAPI 3.1, tools.json, ai-plugin.json.' },
  { name: 'mcp',      deps: { '@next-ai-ready/core': 'workspace:*', '@next-ai-ready/actions': 'workspace:*', '@next-ai-ready/semantic': 'workspace:*' }, desc: 'MCP bridge over vercel/mcp-handler.' },
  { name: 'next',     deps: { '@next-ai-ready/core': 'workspace:*', '@next-ai-ready/semantic': 'workspace:*', '@next-ai-ready/mdx': 'workspace:*', '@next-ai-ready/actions': 'workspace:*', '@next-ai-ready/llms': 'workspace:*', '@next-ai-ready/openapi': 'workspace:*', '@next-ai-ready/mcp': 'workspace:*' }, desc: 'Next.js plugin, route handlers, build CLI.' },
];

function writePkg(dir, json) {
  writeFileSync(join(dir, 'package.json'), JSON.stringify(json, null, 2) + '\n');
}
function writeTs(dir) {
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
    extends: '../../tsconfig.base.json',
    compilerOptions: { outDir: 'dist', rootDir: 'src' },
    include: ['src'],
  }, null, 2) + '\n');
}
function writeTsup(dir, extra = '') {
  writeFileSync(join(dir, 'tsup.config.ts'),
    `import { defineConfig } from 'tsup'\n\nexport default defineConfig({\n  entry: ['src/index.ts'],\n  format: ['esm'],\n  dts: true,\n  clean: true,\n  sourcemap: true,\n  target: 'node20',${extra}\n})\n`);
}

for (const p of pkgs) {
  const dir = join(root, 'packages', p.name);
  mkdirSync(join(dir, 'src'), { recursive: true });
  writePkg(dir, {
    name: `@next-ai-ready/${p.name}`,
    version: '0.0.0',
    description: p.desc,
    license: 'MIT',
    type: 'module',
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
    files: ['dist', 'README.md'],
    scripts: {
      build: 'tsup',
      dev: 'tsup --watch',
      typecheck: 'tsc --noEmit',
      test: 'vitest run',
      clean: 'rm -rf dist .turbo',
    },
    dependencies: p.deps,
    devDependencies: { tsup: '^8.3.0', typescript: '^5.6.0', vitest: '^2.1.0' },
  });
  writeTs(dir);
  writeTsup(dir);
  writeFileSync(join(dir, 'src', 'index.ts'),
    `// @next-ai-ready/${p.name}\n// ${p.desc}\nexport {}\n`);
  writeFileSync(join(dir, 'README.md'),
    `# @next-ai-ready/${p.name}\n\n${p.desc}\n\nPart of [next-ai-ready](../../README.md). 🚧 Pre-alpha.\n`);
}

// meta package
const meta = join(root, 'packages', 'meta');
mkdirSync(join(meta, 'src'), { recursive: true });
const metaDeps = Object.fromEntries(pkgs.map(p => [`@next-ai-ready/${p.name}`, 'workspace:*']));
writePkg(meta, {
  name: 'next-ai-ready',
  version: '0.0.0',
  description: 'AEO + Agent-API layer for Next.js. Make your site readable by AI and callable by agents.',
  license: 'MIT',
  type: 'module',
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js' } },
  bin: { 'next-ai-ready': './dist/cli.js' },
  files: ['dist', 'README.md'],
  scripts: { build: 'tsup', dev: 'tsup --watch', typecheck: 'tsc --noEmit', clean: 'rm -rf dist .turbo' },
  dependencies: metaDeps,
  devDependencies: { tsup: '^8.3.0', typescript: '^5.6.0' },
});
writeTs(meta);
writeFileSync(join(meta, 'tsup.config.ts'),
  `import { defineConfig } from 'tsup'\n\nexport default defineConfig({\n  entry: ['src/index.ts', 'src/cli.ts'],\n  format: ['esm'],\n  dts: { entry: 'src/index.ts' },\n  clean: true,\n  sourcemap: true,\n  target: 'node20',\n})\n`);
writeFileSync(join(meta, 'src', 'index.ts'),
  `// next-ai-ready meta package — re-exports the common public API.\nexport * from '@next-ai-ready/core'\n// Re-exports become real once downstream packages export them.\n// export { defineAction } from '@next-ai-ready/actions'\n// export { withAiReady } from '@next-ai-ready/next'\n`);
writeFileSync(join(meta, 'src', 'cli.ts'),
  `#!/usr/bin/env node\n// next-ai-ready CLI entry — forwards to @next-ai-ready/next CLI when implemented.\nconsole.log('next-ai-ready CLI — not yet implemented (Phase 2).')\nprocess.exit(0)\n`);
writeFileSync(join(meta, 'README.md'),
  `# next-ai-ready\n\nOne-line install for the full next-ai-ready stack.\n\n\`\`\`bash\npnpm add next-ai-ready\nnpx next-ai-ready init\n\`\`\`\n\nSee the [project README](../../README.md) for the full picture.\n`);

console.log(`Scaffolded ${pkgs.length} packages + meta.`);
