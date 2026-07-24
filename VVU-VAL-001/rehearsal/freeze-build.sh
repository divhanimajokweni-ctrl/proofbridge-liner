#!/usr/bin/env bash
# VVU-VAL-001 · Build Freeze Script
#
# Freezes the build for the validation event:
#   1. Records the current git commit hash
#   2. Tags the commit as VAL-001 (validation event tag, separate from software release tags)
#   3. Builds the container image and records both the tag AND the digest
#   4. Writes patched manifests to release/ without mutating tracked source manifests
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
#   ./freeze-build.sh --destructive  # allow in-place manifest mutation (not recommended)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
# shellcheck disable=SC1090
source "${LIB_DIR}/lib.sh"

IMAGE="vvu/epistemic-runtime"
VAL_TAG="VAL-001"
DESTRUCTIVE=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image) IMAGE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --destructive) DESTRUCTIVE=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(git_root "${VAL_DIR}/..")"
FROZEN_JSON="${VAL_DIR}/protocol/frozen-build.json"
RELEASE_DIR="${VAL_DIR}/release"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VVU-VAL-001 · Build Freeze                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
info "repo_root=$REPO_ROOT"
info "val_dir=$VAL_DIR"
info "release_dir=$RELEASE_DIR"
info "image=$IMAGE tag=$VAL_TAG destructive=$DESTRUCTIVE dry_run=$DRY_RUN"

# ── 1. Record commit hash ──────────────────────────────────────────────────
echo "=== 1. Record commit hash ==="
COMMIT=$(git -C "$REPO_ROOT" rev-parse HEAD)
COMMIT_SHORT=$(echo "$COMMIT" | cut -c1-7)
echo "commit: $COMMIT"
echo ""

# ── 2. Tag the commit as VAL-001 (validation event tag) ─────────────────────
echo "=== 2. Tag commit as ${VAL_TAG} ==="
if git -C "$REPO_ROOT" rev-parse --verify "refs/tags/${VAL_TAG}" &>/dev/null 2>&1; then
  echo "⚠ tag ${VAL_TAG} already exists — re-tagging (force)"
  git -C "$REPO_ROOT" tag -f "$VAL_TAG" "$COMMIT"
else
  git -C "$REPO_ROOT" tag "$VAL_TAG" "$COMMIT"
fi
echo "tagged: ${VAL_TAG} → ${COMMIT_SHORT}"
echo ""

# ── 3. Build container image and record tag + digest ────────────────────────
echo "=== 3. Build container image (tag + digest) ==="
IMAGE_TAGGED="${IMAGE}:${VAL_TAG}"
IMAGE_STATUS="$IMAGE_STATUS_NOT_AVAILABLE"
echo "building: ${IMAGE_TAGGED}"
if [[ "$DRY_RUN" -eq 0 ]]; then
  if command -v docker &>/dev/null 2>&1; then
    echo "  docker build -t ${IMAGE_TAGGED} ${REPO_ROOT}"
    if docker build -t "$IMAGE_TAGGED" "$REPO_ROOT" >/tmp/vvu-docker-build.log 2>&1; then
      IMAGE_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_TAGGED" 2>/dev/null | sed 's/.*@//' || echo "")
      if [[ -z "$IMAGE_DIGEST" ]]; then
        IMAGE_DIGEST=$(docker inspect --format='{{.Id}}' "$IMAGE_TAGGED" 2>/dev/null || echo "")
      fi
      IMAGE_STATUS="$IMAGE_STATUS_BUILT"
    else
      echo "  (docker build failed — see /tmp/vvu-docker-build.log)"
      IMAGE_DIGEST=""
    fi
  elif command -v podman &>/dev/null 2>&1; then
    echo "  podman build -t ${IMAGE_TAGGED} ${REPO_ROOT}"
    if podman build -t "$IMAGE_TAGGED" "$REPO_ROOT" >/tmp/vvu-podman-build.log 2>&1; then
      IMAGE_DIGEST=$(podman inspect --format='{{.Digest}}' "$IMAGE_TAGGED" 2>/dev/null || echo "")
      IMAGE_STATUS="$IMAGE_STATUS_BUILT"
    else
      echo "  (podman build failed — see /tmp/vvu-podman-build.log)"
      IMAGE_DIGEST=""
    fi
  else
    echo "  (no container runtime found)"
    IMAGE_DIGEST=""
  fi
else
  echo "[dry-run] would build ${IMAGE_TAGGED}"
  IMAGE_DIGEST="sha256:dryrun0000000000000000000000000000000000000000000000000000000000"
  IMAGE_STATUS="$IMAGE_STATUS_BUILT"
fi

# Pin manifests only when digest is real
if [[ -n "$IMAGE_DIGEST" ]]; then
  IMAGE_STATUS="$IMAGE_STATUS_PINNED"
fi
echo "image tag:    ${IMAGE_TAGGED}"
echo "image digest: ${IMAGE_DIGEST:-<none>}"
echo "image status: ${IMAGE_STATUS}"
echo ""

# ── 4. Materialize frozen manifests into release/ (no in-place mutation by default)
echo "=== 4. Materialize manifests to release/ ==="
mkdir -p "$RELEASE_DIR"
if [[ -f "$VAL_DIR/kubernetes/runtime.yaml" ]]; then
  if [[ "$IMAGE_STATUS" == "$IMAGE_STATUS_PINNED" ]]; then
    if [[ "$DESTRUCTIVE" -eq 1 ]]; then
      echo "  ⚠ DESTRUCTIVE mode: patching tracked manifests in-place"
      TARGET_DIR="${VAL_DIR}/kubernetes"
    else
      echo "  (safe mode: writing pinned copies to release/)"
      TARGET_DIR="$RELEASE_DIR"
    fi

    # Copy selected manifests into release/ when safe
    if [[ "$DESTRUCTIVE" -eq 0 ]]; then
      mkdir -p "$RELEASE_DIR"
      for SRC in "${VAL_DIR}/kubernetes/"*.yaml; do
        [[ -f "$SRC" ]] || continue
        cp -f "$SRC" "$RELEASE_DIR/$(basename "$SRC")"
      done
    fi

    PINNED_COUNT=0
    for MANIFEST in "$TARGET_DIR"/*.yaml; do
      [[ -f "$MANIFEST" ]] || continue
      if grep -q "image:.*${IMAGE}" "$MANIFEST" 2>/dev/null; then
        echo "  → pinning $(basename "$MANIFEST")"
        tmp="${MANIFEST}.tmp"
        sed "s|image: ${IMAGE}:.*|image: ${IMAGE}@${IMAGE_DIGEST}|g" "$MANIFEST" > "$tmp" && mv "$tmp" "$MANIFEST"
        PINNED_COUNT=$((PINNED_COUNT + 1))
      fi
    done
    echo "  ✓ pinned $PINNED_COUNT manifest(s) to digest ${IMAGE_DIGEST:0:30}..."
  else
    echo "  (skipping manifest pinning — image status: ${IMAGE_STATUS})"
    # Still populate release/ with untouched copies for completeness
    if [[ "$DESTRUCTIVE" -eq 0 ]]; then
      mkdir -p "$RELEASE_DIR"
      for SRC in "${VAL_DIR}/kubernetes/"*.yaml; do
        [[ -f "$SRC" ]] || continue
        cp -f "$SRC" "$RELEASE_DIR/$(basename "$SRC")"
      done
    fi
  fi
else
  warn "no kubernetes/ directory found — skipping manifest materialization"
fi
echo ""

# ── 5. Write frozen-build.json ─────────────────────────────────────────────
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
  "image_status": "${IMAGE_STATUS}",
  "git_tag": "${VAL_TAG}",
  "frozen_by": "$(whoami)",
  "frozen_on_host": "$(hostname)",
  "release_dir": "${RELEASE_DIR}"
}
EOF
echo "written: $FROZEN_JSON"
cat "$FROZEN_JSON"
echo ""

# ── 6. Generate SHA-256 manifest of frozen artefacts ────────────────────────
echo "=== 6. SHA-256 manifest of frozen artefacts ==="
FROZEN_SHA="${VAL_DIR}/protocol/frozen-build.sha256"
if [[ "$DRY_RUN" -eq 0 ]]; then
  hash_file "$FROZEN_JSON" > "$FROZEN_SHA"
  hash_file "${VAL_DIR}/chaos/schedule.yaml" >> "$FROZEN_SHA"
  if [[ -f "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" ]]; then
    hash_file "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" >> "$FROZEN_SHA"
  fi
  # Hash release/ manifests as the canonical frozen deployment artifacts
  if [[ -d "$RELEASE_DIR" ]]; then
    for f in "$RELEASE_DIR"/*.yaml; do
      [[ -f "$f" ]] || continue
      hash_file "$f" >> "$FROZEN_SHA"
    done
  fi
  echo "written: $FROZEN_SHA"
  cat "$FROZEN_SHA"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  BUILD FROZEN                                                  ║"
echo "║  Commit:  ${COMMIT_SHORT}"
echo "║  Tag:     ${VAL_TAG}"
echo "║  Digest:  ${IMAGE_DIGEST:0:40}..."
echo "║  Status:  ${IMAGE_STATUS}"
echo "║"
echo "║  Next: publish the protocol PDF with this commit hash,        ║"
echo "║  then run the public validation:                              ║"
echo "║    bash rehearsal/run-rehearsal.sh --realtime                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
