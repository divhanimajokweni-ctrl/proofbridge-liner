#!/bin/bash
# VV LLC Hook Installer
# Run once from the repo root on any machine where you develop.
# Usage: bash install-hooks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/.git/hooks"
SOURCE_DIR="$SCRIPT_DIR/.vvllc"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "ERROR: .git/hooks not found. Run this from the repo root."
  exit 1
fi

if [ ! -f "$SOURCE_DIR/pre-commit" ]; then
  echo "ERROR: .vvllc/pre-commit not found. Run this from the repo root."
  exit 1
fi

echo "Installing VV LLC git hooks..."

# pre-commit
cp "$SOURCE_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
echo "  ✓ pre-commit installed"

# commit-msg
cp "$SOURCE_DIR/commit-msg" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"
echo "  ✓ commit-msg installed"

echo ""
echo "============================================"
echo "VV LLC hooks installed successfully."
echo ""
echo "NEXT: Set your REVIEW_TOKEN environment variable."
echo "  1. Generate a token (run once):"
echo "     openssl rand -hex 32"
echo ""
echo "  2. Add to your shell profile (~/.zshrc or ~/.bashrc):"
echo "     export REVIEW_TOKEN=<your-generated-token>"
echo ""
echo "  3. Add the same token as a GitHub secret:"
echo "     gh secret set REVIEW_TOKEN"
echo "     (paste the same token value)"
echo ""
echo "  4. Compute your commit token prefix:"
echo "     echo -n \"\$REVIEW_TOKEN\" | sha256sum | cut -c1-8"
echo "     Use this value in every commit as: sha256:<value>"
echo "============================================"
