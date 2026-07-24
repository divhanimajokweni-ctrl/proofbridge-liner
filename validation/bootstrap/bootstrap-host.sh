#!/usr/bin/env bash
# VVU-VAL-001 · Host Bootstrap Script
#
# Installs or verifies:
#   - kubectl
#   - k3s
#   - Docker / kind (if selected)
#   - Helm
#   - jq
#   - yq
#   - curl
#   - openssl
#   - python3
#   - git
#   - make
#   - task
#
# Usage:
#   ./bootstrap-host.sh            # best-effort install
#   ./bootstrap-host.sh --check    # report missing only
#   ./bootstrap-host.sh --print    # print exact commands only, do not run

set -euo pipefail

PRINT_ONLY=0
CHECK_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --print) PRINT_ONLY=1; shift ;;
    --check) CHECK_ONLY=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$PRINT_ONLY" -eq 1 ]]; then
    echo "[would run] $*"
    return 0
  fi
  echo "[run] $*"
  "$@"
}

os="$(uname -s || echo unknown)"
arch="$(uname -m || echo unknown)"
missing=()
cmd_exists() { command -v "$1" &>/dev/null; }
version_ge() { [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]; }

check() {
  local name="$1"; shift
  local need="$1"; shift
  local have
  if cmd_exists "$name"; then
    have=$("$@" 2>/dev/null || echo "")
    if [[ -n "$have" ]]; then
      echo "  ✓ $name: $have"
      return 0
    fi
  fi
  echo "  ✗ $name: missing or unusable (need >= $need)"
  missing+=("$name")
  return 1
}

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Host Bootstrap                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "OS: $os/$arch"
echo ""

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  echo "=== Check mode ==="
fi

# Base tools
check curl "7.68" curl --version | head -n1 || true
check openssl "3.0" openssl version || true
check git "2.40" git --version || true
check make "4.3" make --version | head -n1 || true
check jq "1.6" jq --version || true
check python3 "3.11" python3 --version || true

# yq
if cmd_exists yq; then
  check yq "4.35" yq --version || true
else
  echo "  ✗ yq: missing"
  missing+=("yq")
fi

# kubectl
if cmd_exists kubectl; then
  check kubectl "1.29" kubectl version --client || true
else
  echo "  ✗ kubectl: missing"
  missing+=("kubectl")
fi

# k3s
if cmd_exists k3s; then
  check k3s "1.29" k3s --version || true
else
  echo "  ✗ k3s: missing"
  missing+=("k3s")
fi

# Container runtime
if cmd_exists docker; then
  check docker "24.0" docker version || true
elif cmd_exists podman; then
  echo "  ℹ podman detected; Docker not required"
else
  echo "  ✗ docker/podman: missing"
  missing+=("docker")
fi

# kind
if cmd_exists kind; then
  check kind "0.22" kind version || true
else
  echo "  ⚠ kind: missing (only needed for Docker-based Kubernetes)"
fi

# Helm
if cmd_exists helm; then
  check helm "3.14" helm version --short || true
else
  echo "  ⚠ helm: missing (optional)"
fi

# task
if cmd_exists task; then
  check task "3.36" task --version || true
else
  echo "  ⚠ task: missing (optional task runner)"
fi

echo ""
if [[ ${#missing[@]} -eq 0 ]]; then
  echo "✓ All required tools present."
  exit 0
fi

echo "Missing required tools: ${missing[*]}"

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  exit 0
fi

echo ""
echo "=== Automatic install (best-effort) ==="
if [[ "$os" == "Linux" ]]; then
  echo "Detected Linux"
  if [[ "$PRINT_ONLY" -eq 1 ]]; then
    echo ""
    echo "Exact commands required:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y ca-certificates curl gnupg lsb-release openssl jq python3 git make bash"
    echo "  curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg"
    echo "  echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list"
    echo "  sudo apt-get update && sudo apt-get install -y kubectl"
    echo "  curl -fsSL https://get.k3s.io | sudo sh -"
    echo "  mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config"
    echo "  sudo apt-get install -y docker.io && sudo systemctl enable --now docker"
    echo "  go install github.com/go-task/task/v3/cmd/task@latest"
    echo "  go install github.com/kubernetes-sigs/kind@latest"
    echo "  curl -fsSL https://get.helm.sh/helm-v3.14.4-linux-amd64.tar.gz | tar -xz && sudo mv linux-amd64/helm /usr/local/bin/helm"
    echo "  sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/download/v4.44.1/yq_linux_amd64 && sudo chmod +x /usr/local/bin/yq"
    exit 0
  fi

  if [[ "$(id -u)" -ne 0 ]]; then
    echo "⚠ Not root; running as $(id -un). Will use sudo where needed."
    SUDO="sudo"
  else
    SUDO=""
  fi

  $SUDO apt-get update || echo "apt-get update failed"
  $SUDO apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release openssl jq python3 git make bash || echo "apt base install failed"
  $SUDO install -m 0755 -d /etc/apt/keyrings 2>/dev/null || true
  curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | \
    $SUDO gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg 2>/dev/null || true
  echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /" | \
    $SUDO tee /etc/apt/sources.list.d/kubernetes.list >/dev/null 2>&1 || true
  $SUDO apt-get update || true
  $SUDO apt-get install -y kubectl || echo "kubectl install failed"
  curl -fsSL https://get.k3s.io | $SUDO sh - || echo "k3s install failed"
  $SUDO mkdir -p /etc/rancher/k3s 2>/dev/null || true
  if [[ -f /etc/rancher/k3s/k3s.yaml ]]; then
    mkdir -p "$HOME/.kube"
    $SUDO cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config" 2>/dev/null || true
    $SUDO chown "$(id -u):$(id -g)" "$HOME/.kube/config" 2>/dev/null || true
  fi
  $SUDO apt-get install -y docker.io 2>/dev/null || echo "docker install failed"
  $SUDO systemctl enable --now docker 2>/dev/null || echo "docker enable failed"
elif [[ "$os" == "Darwin" ]]; then
  echo "Detected macOS"
  if [[ "$PRINT_ONLY" -eq 1 ]]; then
    echo ""
    echo "Exact commands required:"
    echo "  brew install kubectl k3s docker kind helm jq yq curl openssl python3 git make task"
    exit 0
  fi
  if ! cmd_exists brew; then
    echo "✗ brew not found. Install Homebrew first: https://brew.sh"
    exit 2
  fi
  brew install kubectl k3s docker kind helm jq yq curl openssl python3 git make task || echo "brew install failed"
else
  echo "Unsupported OS: $os"
  echo "Exact commands required:"
  echo "  kubectl >= 1.29"
  echo "  k3s >= 1.29"
  echo "  docker/podman/minikube"
  echo "  jq, yq, curl, openssl, python3, git, make"
  exit 2
fi

echo ""
echo "=== Post-install verification ==="
for c in kubectl k3s docker jq curl openssl python3 git make; do
  if cmd_exists "$c"; then
    echo "  ✓ $c"
  else
    echo "  ✗ $c still missing"
  fi
done

echo ""
echo "If any tool is still missing, rerun with --print to see exact commands."
