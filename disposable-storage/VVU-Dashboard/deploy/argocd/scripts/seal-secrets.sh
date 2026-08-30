#!/usr/bin/env bash
# VVU Production Dashboard — Seal Secrets
#
# Uses Sealed Secrets to encrypt sensitive values for GitOps storage.
# Requires: kubeseal CLI + Sealed Secrets controller installed on cluster.
#
# Usage:
#   ./seal-secrets.sh                    # seal all secrets from base/secret.yaml
#   ./seal-secrets.sh --controller-name=sealed-secrets --controller-namespace=kube-system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SECRET_FILE="${SCRIPT_DIR}/../base/secret.yaml"
SEALED_FILE="${SCRIPT_DIR}/../base/sealed-secret.yaml"

if ! command -v kubeseal &>/dev/null 2>&1; then
  echo "kubeseal not found. Install: https://github.com/bitnami-labs/sealed-secrets#installation-from-source"
  exit 1
fi

echo "=== Sealing VVU Dashboard secrets ==="

# Create a temporary secret with real values
echo "Enter secret values (input is hidden):"
read -s -p "  NEXTAUTH_SECRET: " NEXTAUTH_SECRET; echo
read -s -p "  DATABASE_ENCRYPTION_KEY: " DATABASE_ENCRYPTION_KEY; echo
read -s -p "  STITCH_API_KEY: " STITCH_API_KEY; echo
read -s -p "  STITCH_WEBHOOK_SECRET: " STITCH_WEBHOOK_SECRET; echo
read -s -p "  POLYGON_PRIVATE_KEY: " POLYGON_PRIVATE_KEY; echo
read -s -p "  RESEND_API_KEY: " RESEND_API_KEY; echo
read -s -p "  GITHUB_TOKEN: " GITHUB_TOKEN; echo

# Create a Kubernetes secret manifest with real values
TMP=$(mktemp)
cat > "$TMP" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: vvu-dashboard-secrets
  namespace: vvu-dashboard
type: Opaque
stringData:
  NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
  DATABASE_ENCRYPTION_KEY: "${DATABASE_ENCRYPTION_KEY}"
  STITCH_API_KEY: "${STITCH_API_KEY}"
  STITCH_WEBHOOK_SECRET: "${STITCH_WEBHOOK_SECRET}"
  POLYGON_PRIVATE_KEY: "${POLYGON_PRIVATE_KEY}"
  RESEND_API_KEY: "${RESEND_API_KEY}"
  GITHUB_TOKEN: "${GITHUB_TOKEN}"
EOF

# Seal it
kubeseal --format yaml < "$TMP" > "$SEALED_FILE"
rm -f "$TMP"

echo ""
echo "✓ Sealed secret written to: $SEALED_FILE"
echo "  This file is safe to commit to Git."
echo "  Replace base/secret.yaml with base/sealed-secret.yaml in kustomization.yaml."
