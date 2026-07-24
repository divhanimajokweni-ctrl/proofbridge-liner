#!/usr/bin/env bash
# VVU Production Dashboard — Rollback via Argo CD
#
# Usage:
#   ./rollback.sh production   # rollback production to previous revision
#   ./rollback.sh staging 2    # rollback staging to revision 2
#
# Failure policy:
#   - If argocd CLI is unavailable, this script exits non-zero instead of
#     silently pausing reconciliation.
#   - This script never disables auto-sync as a substitute for rollback.

set -euo pipefail

ENV="${1:?usage: $0 <staging|production> [revision-number]}"
REVISION="${2:-}"

APP="vvu-dashboard-${ENV}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== Rolling back $APP ==="

REV=""
if [[ -n "$REVISION" ]]; then
  REV="$REVISION"
else
  if ! command -v argocd &>/dev/null 2>&1; then
    echo "argocd CLI not found. Install: https://argo-cd.readthedocs.io/en/stable/user-guide/argocd_cli/" >&2
    exit 1
  fi
  echo "→ current deployment history:"
  argocd app history "$APP" || true
  REV=$(argocd app history "$APP" --output json 2>/dev/null | python -c "import sys,json; items=sorted(json.load(sys.stdin), key=lambda x: x.get('id',0), reverse=True); print(items[1].get('id')) if len(items)>1 else ''" || true)
  if [[ -z "$REV" ]]; then
    echo "✗ unable to determine previous revision" >&2
    exit 1
  fi
  echo "→ rolling back to revision $REV"
fi

if ! command -v argocd &>/dev/null 2>&1; then
  echo "✗ argocd CLI not found; cannot perform rollback" >&2
  exit 1
fi

argocd app rollback "$APP" "$REV"
argocd app wait "$APP" --health --timeout 300

echo "✓ rollback complete: $APP -> revision $REV"
echo "  State after rollback:"
argocd app get "$APP" -o name || true

NS=$([[ "$ENV" == "staging" ]] && echo "vvu-staging" || echo "vvu-dashboard")
echo "→ pods in $NS:"
kubectl get pods -n "$NS" 2>/dev/null || true
