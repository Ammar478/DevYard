#!/usr/bin/env bash
set -euo pipefail

echo "=== DevYard Installer ==="

# Install pnpm if not present
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build
echo "Building..."
pnpm build

# Link globally
echo "Linking globally..."
pnpm link --global

# Run init
echo "Running devyard init..."
devyard init

echo "=== DevYard installed successfully ==="
