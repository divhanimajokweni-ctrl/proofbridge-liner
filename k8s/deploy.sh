# VVU-IVE Webhook Subsystem — K8s Deploy Script
# ----------------------------------------------------------------------------
# Implements Section 14.5 of the VVU-IVE Reliability Contract v1.1.
#
# Usage:
#   kubectl apply -f k8s/envoy-configmap.yaml
#   kubectl apply -f k8s/envoy-deployment.yaml
#   kubectl apply -f k8s/vvu-ive-worker-deployment.yaml
#   kubectl apply -f k8s/vvu-ive-worker-netpol.yaml
#
# Or: bash k8s/deploy.sh

set -euo pipefail

echo "==> Applying Envoy Egress Gateway ConfigMap..."
kubectl apply -f k8s/envoy-configmap.yaml

echo "==> Applying Envoy Egress Gateway Deployment + Service..."
kubectl apply -f k8s/envoy-deployment.yaml

echo "==> Applying VVU-IVE Webhook Worker Deployments..."
kubectl apply -f k8s/vvu-ive-worker-deployment.yaml

echo "==> Applying Strict Network Isolation Policy..."
kubectl apply -f k8s/vvu-ive-worker-netpol.yaml

echo ""
echo "==> Deploy complete. Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -n vvu-ive -l app=envoy-egress --timeout=120s
kubectl wait --for=condition=ready pod -n vvu-ive -l app=vvu-ive-worker --timeout=120s

echo ""
echo "==> Pod status:"
kubectl get pods -n vvu-ive -o wide

echo ""
echo "==> Slim Shady adversarial validation (Section 13):"
echo "    From a worker pod, verify SSRF is blocked:"
echo "    kubectl exec -n vvu-ive deploy/vvu-ive-webhook-worker -- curl -sSI http://169.254.169.254/latest/meta-data/ | head -1"
echo "    Expected: HTTP/1.1 403"
