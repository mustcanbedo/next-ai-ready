#!/usr/bin/env bash
# Publish all packages to npm @alpha using pnpm (rewrites workspace:* → semver).
#
# Do NOT use bare `npm publish` from package dirs — it leaks workspace:* and
# breaks `pnpm add next-ai-ready@alpha` for external users.
#
# Skips packages whose version already exists on the registry.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PACKAGES=(core semantic mdx actions llms openapi mcp next meta)

echo "Building first…"
pnpm build

for pkg in "${PACKAGES[@]}"; do
  dir="packages/$pkg"
  name=$(node -p "require('./${dir}/package.json').name")
  version=$(node -p "require('./${dir}/package.json').version")

  if npm view "${name}@${version}" version &>/dev/null; then
    echo "⏭  ${name}@${version} already on npm — skip"
    continue
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Publishing ${name}@${version} …"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  (cd "$dir" && pnpm publish --tag alpha --access public --no-git-checks)
done

echo ""
echo "Done. Verify:"
echo "  npm view next-ai-ready dist-tags"
echo "  npm view next-ai-ready@alpha dependencies"
