# VVU-VAL-001 · Environment Requirements

This document lists exact software prerequisites, versions, install commands, and verification commands for executing the complete 72-hour validation rehearsal.

## Host OS

Supported:
- Linux x86_64 (Ubuntu 22.04/24.04, Debian 12+)
- macOS 14+ (arm64/x86_64)
- Windows 10/11 with Git Bash / MSYS2 and WSL2 backend

Recommended:
- Linux x86_64 with 8 CPU, 16 GB RAM, 120 GB disk, 4 MB/s sustained network

## Required Software

| Software       | Minimum version | Preferred | Verification command                  | Notes                                      |
|----------------|-----------------|-----------|---------------------------------------|--------------------------------------------|
| kubectl        | 1.29            | latest    | kubectl version --client              | Required for cluster management            |
| k3s            | 1.29            | latest    | k3s --version                         | Lightweight Kubernetes for validation runs |
| Docker Engine  | 24.0            | 25.x+     | docker version / docker info          | If k3s is not used directly                |
| kind           | 0.22            | latest    | kind version                          | Only if Docker-based cluster is used       |
| Helm           | 3.14            | latest    | helm version                          | Optional, for manifest packaging           |
| jq             | 1.6             | latest    | jq --version                          | Script JSON manipulation                   |
| yq             | 4.35            | latest    | yq --version                          | YAML manipulation                          |
| curl           | 7.68            | latest    | curl --version                        | HTTP operations                            |
| openssl        | 3.0             | latest    | openssl version                       | SHA-256 manifests, TLS operations          |
| python3        | 3.11            | 3.12+     | python3 --version                     | Validation index, replay scripts           |
| git            | 2.40            | latest    | git --version                         | Commit hash recording, tagging             |
| make           | 4.3             | latest    | make --version                        | Task runner interface                      |
| task           | 3.36            | latest    | task --version                        | Task runner interface                      |
| bash           | 5.1             | latest    | bash --version                        | All scripts                                |

Optional:
- podman 4.x+/minikube 1.33+ if those runtimes replace k3s/kind

## Installation Commands

### Ubuntu / Debian

```bash
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release openssl jq python3 python3-venv \
  make bash git openssh-client
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /" | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubectl
curl -fsSL https://get.k3s.io | sudo sh -
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && \
  sudo chown "$(id -u):$(id -g)" ~/.kube/config
DOCKER_URL=https://download.docker.com/linux/ubuntu
curl -fsSL $DOCKER_URL/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  $DOCKER_URL $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
go install github.com/go-task/task/v3/cmd/task@latest
go install github.com/kubernetes-sigs/kind@latest
```

### macOS (brew)

```bash
brew install kubectl k3s docker kind helm jq yq curl openssl python3 git make task
sudo curl -L "https://dl.k8s.io/release/$(kubectl version -o json | \
  jq -r '.serverVersion.gitVersion')/bin/darwin/$(uname -m)/kubectl" -o /usr/local/bin/kubectl
k3s server --write-kubeconfig ~/.kube/config --write-kubeconfig-mode 600 &
```

### Windows (PowerShell admin)

```powershell
winget install -e --id Kubernetes.kubectl
winget install -e --id K3s.k3s
winget install -e --id Docker.DockerDesktop
winget install -e --id GoLang.GoLang
choco install -y kind helm jq yq python3 git make chocolatey-compatibility.openssl
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

## Verification Commands

```bash
kubectl version --client
kubectl get nodes
k3s --version || true
docker version || podman version || true
kind get clusters || true
helm version --short
jq --version
yq --version
curl --version | head -n1
openssl version
python3 --version
git --version
make --version | head -n1
task --version || true
```

## Expected Versions

Use these versions to keep the rehearsal deterministic:
- Kubernetes: 1.29.x
- k3s: >=1.29
- Docker: >=24.0
- kind: >=0.22
- Python: >=3.11
- jq: >=1.6
- yq: >=4.35

## Estimated Setup Time

| Environment   | Time | Notes                               |
|---------------|------|-------------------------------------|
| Existing k3s | 5m   | Run freeze-build + rehearsal         |
| Docker + kind | 20m  | Container install + cluster creation |
| Bare k3s     | 20m  | k3s install + verification           |
| Minikube     | 25m  | driver + addon setup may vary        |
| Windows WSL2 | 35m  | WSL2 + distro + Docker/kind layer    |

## Bootstrap

Use:
```bash
validation/bootstrap/bootstrap-host.sh
```

If automatic installation is unavailable due to permissions, the script prints exact commands.

## Troubleshooting

- If `kubectl` points to a remote cluster, set KUBECONFIG explicitly.
- If Docker is unavailable, use Podman or minikube.
- If `python3` is missing, create `python3 -> python` symlink.
- If scripts fail with CRLF errors, run `dos2unix` on scripts or notify ops.
