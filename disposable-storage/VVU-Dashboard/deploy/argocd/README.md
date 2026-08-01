# VVU Production Dashboard — Argo CD GitOps Deployment Package

This directory contains a complete Argo CD + Kubernetes deployment package for the VVU Production Dashboard. It uses the **App-of-Apps** pattern with Kustomize overlays for staging and production environments.

## Quick Start

```bash
# 1. Push the VVU dashboard code to your Git repo
git remote add origin https://github.com/vvu/proofbridge-liner.git
git push -u origin main

# 2. Install Argo CD on your cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Get the Argo CD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 4. Apply the root App-of-Apps
kubectl apply -f deploy/argocd/root-app.yaml

# 5. Argo CD will automatically sync:
#    - vvu-dashboard (staging → production)
#    - vvu-monitoring (Prometheus + Grafana)
#    - vvu-namespace + RBAC
```

## Structure

```
deploy/argocd/
├── root-app.yaml                    ← App-of-Apps root (apply this first)
├── base/                            ← Kustomize base (shared manifests)
│   ├── kustomization.yaml
│   ├── namespace.yaml               ← vvu-dashboard namespace
│   ├── deployment.yaml              ← Next.js dashboard deployment
│   ├── service.yaml                 ← ClusterIP service
│   ├── ingress.yaml                 ← Ingress with TLS
│   ├── configmap.yaml               ← Runtime configuration
│   ├── secret.yaml                  ← Sealed secrets template
│   ├── hpa.yaml                     ← Horizontal Pod Autoscaler
│   ├── pdb.yaml                     ← Pod Disruption Budget
│   ├── networkpolicy.yaml           ← Network security policies
│   └── serviceaccount.yaml          ← SA + RBAC
├── overlays/
│   ├── staging/                     ← Staging overlay (1 replica, testnet)
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── ingress-patch.yaml
│   │   └── configmap-patch.yaml
│   └── production/                  ← Production overlay (3 replicas, mainnet)
│       ├── kustomization.yaml
│       ├── deployment-patch.yaml
│       ├── ingress-patch.yaml
│       └── configmap-patch.yaml
├── apps/                            ← Individual Argo CD Application manifests
│   ├── vvu-dashboard-staging.yaml
│   ├── vvu-dashboard-production.yaml
│   ├── vvu-monitoring.yaml
│   └── vvu-namespace.yaml
├── monitoring/                      ← Prometheus + Grafana manifests
│   ├── prometheus.yaml
│   ├── grafana.yaml
│   ├── servicemonitor.yaml
│   └── grafana-dashboard-cm.yaml
├── scripts/
│   ├── deploy.sh                    ← One-command deploy script
│   ├── seal-secrets.sh              ← Sealed Secrets helper
│   └── rollback.sh                  ← Rollback to previous version
├── charts/
│   └── vvu-dashboard/               ← Helm chart (alternative to Kustomize)
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           └── ingress.yaml
└── README.md                        ← This file
```

## Environments

| Environment | Replicas | Image Tag | Polygon Chain | Resources | Auto-sync |
|-------------|----------|-----------|---------------|-----------|-----------|
| Staging | 1 | `:staging` | Amoy Testnet | 256Mi–512Mi | Enabled |
| Production | 3 | `:production` | Mainnet | 512Mi–1Gi | Enabled (with prune) |

## Image Strategy

Images are tagged per environment:
- `vvu/dashboard:staging` — staging overlay
- `vvu/dashboard:production` — production overlay
- `vvu/dashboard:sha-<git-sha>` — immutable per-commit tags (CI)
- `vvu/dashboard:v1.0.0` — semantic version releases

The Argo CD `imageUpdater` integration can be enabled for automatic image updates on staging.

## Sync Waves

The deployment uses Argo CD sync waves to ensure correct ordering:

| Wave | Resource | Purpose |
|------|----------|---------|
| -10 | Namespace | Create the namespace first |
| -5 | ServiceAccount + RBAC | Service account before pods |
| -3 | ConfigMap + Secret | Config before deployment |
| -2 | NetworkPolicy | Security before pods |
| 0 | Deployment + Service | The application |
| 1 | HPA + PDB | Autoscaling after deployment |
| 2 | Ingress | Route traffic after pods are ready |
| 5 | ServiceMonitor | Monitoring after app is live |

## Rollback

```bash
# Rollback to previous deployment
bash deploy/argocd/scripts/rollback.sh production

# Or via Argo CD CLI
argocd app rollback vvu-dashboard-production
```
