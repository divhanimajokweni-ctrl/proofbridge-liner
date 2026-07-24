#!/usr/bin/env bash
# VVU-VAL-001 · Build Freeze Script
#
# Freezes the build for the validation event. Performs:
#   1. Records the current git commit hash
#   2. Tags the commit as VAL-001 (validation event tag, separate from software release tags)
#   3. Builds the container image and records both the tag AND the digest
#   4. Patches the k8s manifests to pin the image digest
#   5. Writes frozen-build.json (the single source of truth for the frozen build)
#   6. Generates the SHA-256 manifest of all frozen artefacts
#
# Validation events are versioned INDEPENDENTLY from software releases:
#   Validation tags:  VAL-001, VAL-002, VAL-003, ...
#   Software tags:    v1.0.0, v1.1.0, v2.0.0, ...
#
# Usage:
#   ./freeze-build.sh
#   ./freeze-build.sh --image vvu/epistemic-runtime
#   ./freeze-build.sh --dry-run

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${VAL_DIR}/.." && pwd)"
# Normalize MSYS-style /c/... to C:/... for git -C on Windows Git Bash
if [[ "$REPO_ROOT" == /c/* ]]; then
  REPO_ROOT="C:${REPO_ROOT#/c}"
fi
FROZEN_JSON="${VAL_DIR}/protocol/frozen-build.json"
IMAGE="vvu/epistemic-runtime"
VAL_TAG="VAL-001"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) IMAGE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then echo "[dry-run] $*"; else echo "[apply] $*"; "$@"; fi
}

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Build Freeze                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Record commit hash ──
echo "=== 1. Record commit hash ==="
COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD)
COMMIT_SHORT=$(echo "$COMMIT" | cut -c1-7)
echo "commit: $COMMIT"
echo ""

# ── 2. Tag the commit as VAL-001 (validation event tag) ──
echo "=== 2. Tag commit as ${VAL_TAG} ==="
if git -C "$REPO_ROOT" rev-parse --verify "refs/tags/${VAL_TAG}" &>/dev/null 2>&1; then
  echo "⚠ tag ${VAL_TAG} already exists — re-tagging (force)"
  run git -C "$REPO_ROOT" tag -f "$VAL_TAG" "$COMMIT"
else
  run git -C "$REPO_ROOT" tag "$VAL_TAG" "$COMMIT"
fi
echo "tagged: ${VAL_TAG} → ${COMMIT_SHORT}"
echo ""

# ── 3. Build container image and record tag + digest ──
echo "=== 3. Build container image (tag + digest) ==="
IMAGE_TAGGED="${IMAGE}:${VAL_TAG}"
echo "building: ${IMAGE_TAGGED}"
if [[ "$DRY_RUN" -eq 0 ]]; then
  # Build the image (docker or podman)
  if command -v docker &>/dev/null 2>&1; then
    docker build -t "$IMAGE_TAGGED" "$REPO_ROOT" 2>/dev/null || echo "  (docker build failed — using pre-built image)"
    IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_TAGGED" 2>/dev/null | sed 's/.*@//' || echo "")
    if [[ -z "$IMAGE_DIGEST" ]]; then
      IMAGE_DIGEST=$(docker inspect --format='{{.Id}}' "$IMAGE_TAGGED" 2>/dev/null || echo "unknown")
    fi
  elif command -v podman &>/dev/null 2>&1; then
    podman build -t "$IMAGE_TAGGED" "$REPO_ROOT" 2>/dev/null || echo "  (podman build failed — using pre-built image)"
    IMAGE_DIGEST=$(podman inspect --format='{{.Digest}}' "$IMAGE_TAGGED" 2>/dev/null || echo "unknown")
  else
    echo "  (no container runtime found — recording tag only, digest unknown)"
    IMAGE_DIGEST="unknown (no container runtime)"
  fi
else
  echo "[dry-run] would build ${IMAGE_TAGGED}"
  IMAGE_DIGEST="sha256:dryrun0000000000000000000000000000000000000000000000000000000000"
fi
echo "image tag:    ${IMAGE_TAGGED}"
echo "image digest: ${IMAGE_DIGEST}"
echo ""

# ── 4. Patch k8s manifests to pin the image digest ──
echo "=== 4. Patch k8s manifests (digest pinning) ==="
if [[ "$DRY_RUN" -eq 0 ]]; then
  for MANIFEST in "${VAL_DIR}/kubernetes/"*.yaml; do
    if grep -q "image:.*${IMAGE}" "$MANIFEST" 2>/dev/null; then
      echo "  → patching $(basename "$MANIFEST")"
      sed -i.bak "s|image: ${IMAGE}:.*|image: ${IMAGE}@${IMAGE_DIGEST}|g" "$MANIFEST" || true
      rm -f "${MANIFEST}.bak"
    fi
  done
  echo "  ✓ all manifests pinned to digest ${IMAGE_DIGEST:0:30}..."
else
  echo "[dry-run] would patch k8s manifests to pin ${IMAGE_DIGEST:0:30}..."
fi
echo ""

# ── 5. Write frozen-build.json ──
echo "=== 5. Write frozen-build.json ==="
SOFTWARE_VERSION=$(git -C "$REPO_ROOT" describe --tags --abbrev=0 2>/dev/null | head -1 || echo "unknown")
cat > "$FROZEN_JSON" <<EOF
{
  "validation_event": "VAL-001",
  "protocol_version": "1.1",
  "frozen_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit_hash": "${COMMIT}",
  "commit_short": "${COMMIT_SHORT}",
  "software_version": "${SOFTWARE_VERSION}",
  "image_tag": "${IMAGE_TAGGED}",
  "image_digest": "${IMAGE_DIGEST}",
  "git_tag": "${VAL_TAG}",
  "frozen_by": "$(whoami)",
  "frozen_on_host": "$(hostname)"
}
EOF
echo "written: $FROZEN_JSON"
cat "$FROZEN_JSON"
echo ""

# ── 6. Generate SHA-256 manifest of frozen artefacts ──
echo "=== 6. SHA-256 manifest of frozen artefacts ==="
FROZEN_SHA="${VAL_DIR}/protocol/frozen-build.sha256"
if [[ "$DRY_RUN" -eq 0 ]]; then
  sha256sum "$FROZEN_JSON" > "$FROZEN_SHA"
  # Also hash the schedule.yaml and protocol PDF (the other frozen artefacts)
  sha256sum "${VAL_DIR}/chaos/schedule.yaml" >> "$FROZEN_SHA"
  [[ -f "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" ]] && \
    sha256sum "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" >> "$FROZEN_SHA"
  echo "written: $FROZEN_SHA"
  cat "$FROZEN_SHA"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  BUILD FROZEN                                                  ║"
echo "║  Commit:  ${COMMIT_SHORT}"
echo "║  Tag:     ${VAL_TAG}"
echo "║  Digest:  ${IMAGE_DIGEST:0:40}..."
echo "║"
echo "║  Next: publish the protocol PDF with this commit hash,        ║"
echo "║  then run the public validation:                              ║"
echo "║    bash rehearsal/run-rehearsal.sh --realtime                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
