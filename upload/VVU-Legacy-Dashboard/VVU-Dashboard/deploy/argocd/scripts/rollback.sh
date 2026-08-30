#!/usr/bin/env bash
# VVU Production Dashboard — Rollback via Argo CD
#
# Usage:
#   ./rollback.sh production   # rollback production to previous revision
#   ./rollback.sh staging 2    # rollback staging to revision 2

set -euo pipefail

ENV="${1:?usage: $0 <staging|production> [revision-number]}"
REVISION="${2:-}"

APP="vvu-dashboard-${ENV}"

echo "=== Rolling back $APP ==="

if command -v argocd &>/dev/null 2>&1; then
  if [[ -n "$REVISION" ]]; then
    echo "→ rolling back to revision $REVISION"
    argocd app rollback "$APP" "$REVISION"
  else
    # List history and rollback to previous
    echo "→ current deployment history:"
    argocd app history "$APP" || true
    echo ""
    echo "→ rolling back to previous revision..."
    argocd app rollback "$APP" || echo "Use: argocd app rollback $APP <revision-number>"
  fi
else
  echo "argocd CLI not found. Using kubectl..."
  # Force Argo CD to resync with previous manifest by disabling auto-sync temporarily
  kubectl patch application "$APP" -n argocd --type merge -p '{"spec":{"syncPolicy":{"automated":null}}}'
  echo "→ auto-sync disabled. Previous revision preserved."
  echo "→ to rollback: install argocd CLI and run: argocd app rollback $APP"
  echo "→ or revert the Git commit and re-enable auto-sync:"
  echo "  kubectl patch application $APP -n argocd --type merge -p '{\"spec\":{\"syncPolicy\":{\"automated\":{\"prune\":true,\"selfHeal\":true}}}}'"
fi

echo ""
echo "=== Pod status ==="
NS=$([[ "$ENV" == "staging" ]] && echo "vvu-staging" || echo "vvu-dashboard")
kubectl get pods -n "$NS" 2>/dev/null || true
