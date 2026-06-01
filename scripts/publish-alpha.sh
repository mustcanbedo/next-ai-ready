#!/usr/bin/env bash
# Publish all @next-ai-ready/* packages + next-ai-ready meta to npm @alpha.
#
# Why not `pnpm -r publish`? pnpm packs to a temp dir and invokes npm without
# an interactive 2FA / WebAuthn prompt — publish fails with E403 when the account
# has auth-and-writes 2FA (Security Key / Touch ID).
#
# This script runs `npm publish` from each package directory so macOS can prompt
# for Touch ID. Expect up to 9 prompts (one per package).
#
# Alternative: Granular Access Token with bypass 2FA → set NPM_TOKEN / .npmrc
# then use: pnpm --filter "./packages/*" publish --tag alpha --access public --no-git-checks --force

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PACKAGES=(core semantic mdx actions llms openapi mcp next meta)

echo "Building first…"
pnpm build

for pkg in "${PACKAGES[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Publishing packages/$pkg …"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  (cd "packages/$pkg" && npm publish --tag alpha --access public)
done

echo ""
echo "Done. Verify:"
echo "  npm view next-ai-ready dist-tags"
