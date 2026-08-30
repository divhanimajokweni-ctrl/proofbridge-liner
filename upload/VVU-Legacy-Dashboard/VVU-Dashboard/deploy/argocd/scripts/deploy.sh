#!/usr/bin/env bash
# VVU Production Dashboard — One-Command Deploy via Argo CD
#
# Usage:
#   ./deploy.sh staging     # deploy to staging
#   ./deploy.sh production  # deploy to production
#   ./deploy.sh install     # install Argo CD itself first

set -euo pipefail

ENV="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

if [[ -z "$ENV" ]]; then
  echo "usage: $0 <staging|production|install>"
  exit 2
fi

case "$ENV" in
  install)
    echo "=== Installing Argo CD ==="
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    echo ""
    echo "Waiting for Argo CD to be ready..."
    kubectl -n argocd wait --for=condition=available deployment/argocd-server --timeout=120s
    echo ""
    echo "=== Argo CD admin password ==="
    kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
    echo ""
    echo ""
    echo "Port-forward to access: kubectl -n argocd port-forward svc/argocd-server 8080:443"
    echo "Then open: https://localhost:8080"
    ;;

  staging|production)
    echo "=== Deploying VVU Dashboard to $ENV ==="

    # Check Argo CD is installed
    if ! kubectl get namespace argocd &>/dev/null 2>&1; then
      echo "Argo CD not found. Run: $0 install"
      exit 1
    fi

    # Apply the root App-of-Apps if not already applied
    if ! kubectl get application vvu-root -n argocd &>/dev/null 2>&1; then
      echo "→ applying root App-of-Apps..."
      kubectl apply -f "${SCRIPT_DIR}/../root-app.yaml"
    fi

    # Apply the specific environment application
    echo "→ applying vvu-dashboard-$ENV application..."
    kubectl apply -f "${SCRIPT_DIR}/../apps/vvu-dashboard-${ENV}.yaml"

    # Wait for sync
    echo "→ waiting for Argo CD sync..."
    sleep 5

    # Check status
    echo ""
    echo "=== Argo CD Application Status ==="
    kubectl get application -n argocd | grep vvu || true
    echo ""

    # Get pods
    NS=$([[ "$ENV" == "staging" ]] && echo "vvu-staging" || echo "vvu-dashboard")
    echo "=== Pods in $NS ==="
    kubectl get pods -n "$NS" 2>/dev/null || echo "(no pods yet — Argo CD is syncing...)"

    echo ""
    echo "=== Next steps ==="
    echo "1. Monitor: kubectl get application -n argocd -w"
    echo "2. Argo CD UI: kubectl -n argocd port-forward svc/argocd-server 8080:443"
    echo "3. Check sync: argocd app get vvu-dashboard-$ENV"
    ;;

  *)
    echo "error: unknown command '$ENV' (expected: staging, production, or install)"
    exit 2
    ;;
esac
