#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== template-react init ==="
echo "cwd: $(pwd)"

echo "=== corepack pnpm lint ==="
corepack pnpm lint

echo "=== corepack pnpm typecheck ==="
corepack pnpm typecheck

echo "=== corepack pnpm build ==="
corepack pnpm build

echo "=== corepack pnpm smoke ==="
corepack pnpm smoke

echo "=== verification complete ==="
