#!/usr/bin/env bash
# Git hooks installer — Deployment Lock
set -euo pipefail

HOOKS_DIR=".git/hooks"
LOCK_SCRIPT="scripts/deployment-loop.sh"

echo "Installing Deployment Lock hooks..."

# Ensure deployment-loop.sh exists
if [ ! -f "$LOCK_SCRIPT" ]; then
  echo "ERROR: $LOCK_SCRIPT not found — aborting"
  exit 1
fi
chmod +x "$LOCK_SCRIPT"

# Install pre-push hook
cat > "$HOOKS_DIR/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

# Guard: skip if already inside a deployment loop
if [ "${DEPLOYMENT_LOCK_ACTIVE:-0}" = "1" ]; then
  exit 0
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH" in
  main|compliance-fabric)
    ;;
  *)
    exit 0
    ;;
esac

if [ ! -f scripts/deployment-loop.sh ]; then
  echo "[LOCK] ERROR: scripts/deployment-loop.sh not found. Run 'scripts/install-hooks.sh' to install."
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  DEPLOYMENT LOCK ACTIVE                                 ║"
echo "║  Running full pipeline: build -> deploy -> verify -> docs"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

exec bash scripts/deployment-loop.sh
HOOK
chmod +x "$HOOKS_DIR/pre-push"

# Install post-commit hook
cat > "$HOOKS_DIR/post-commit" <<'HOOK'
#!/usr/bin/env bash
# Reminder: push required by lock
BRANCH=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH" in
  main|compliance-fabric)
    echo "[LOCK] Commit recorded. Run 'git push' to trigger deployment pipeline."
    ;;
esac
HOOK
chmod +x "$HOOKS_DIR/post-commit"

echo ""
echo "Deployment Lock installed."
echo "  - pre-push:  runs full deployment loop on main/compliance-fabric"
echo "  - post-commit: reminds you to push"
echo ""
echo "Hooks installed at: $HOOKS_DIR"
