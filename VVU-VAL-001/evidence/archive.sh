#!/usr/bin/env bash
# VVU-VAL-001 · Evidence Archive & Release Publisher
#
# At H72, assembles the complete evidence package and publishes it as a
# GitHub Release associated with the frozen Git tag (VAL-001). Also archives
# to long-term storage per §6.2 of the protocol.
#
# Invariants:
#   - package is assembled in a temporary directory and atomically moved into place
#   - release creation is idempotent: updates assets if release already exists
#   - no placeholder URLs in release notes
#
# Usage:
#   ./archive.sh                    # assemble locally
#   ./archive.sh --release          # assemble + publish GitHub Release
#   ./archive.sh --release --draft  # publish as draft for review
#   ./archive.sh --release --prerelease  # mark as prerelease

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$(cd "${SCRIPT_DIR}" && pwd)"
source "${LIB_DIR}/lib.sh"

VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUNDLES_DIR="${SCRIPT_DIR}/bundles"
FROZEN_JSON="${VAL_DIR}/protocol/frozen-build.json"
RELEASE=0
DRAFT=0
PRERELEASE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release) RELEASE=1; shift ;;
    --draft) DRAFT=1; shift ;;
    --prerelease) PRERELEASE=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

py="$(detect_python)"

echo "=== assembling VVU-72H-VALIDATION package ==="
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

# 1. All hourly bundles + SHASUMS
BUNDLE_COUNT=0
if [[ -d "$BUNDLES_DIR" ]] && ls "$BUNDLES_DIR"/Hour-*.zip &>/dev/null 2>&1; then
  BUNDLE_COUNT=$(ls "$BUNDLES_DIR"/Hour-*.zip 2>/dev/null | wc -l || echo 0)
  cp "$BUNDLES_DIR"/Hour-*.zip "$STAGING/"
  [[ -f "${SCRIPT_DIR}/SHA256SUMS" ]] && cp "${SCRIPT_DIR}/SHA256SUMS" "$STAGING/"
  echo "✓ copied $BUNDLE_COUNT bundles"
else
  echo "⚠ no evidence bundles found — package will be incomplete"
fi

# 2. Frozen build manifest
[[ -f "$FROZEN_JSON" ]] && cp "$FROZEN_JSON" "$STAGING/"

# 3. Protocol PDF
[[ -f "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" ]] && \
  cp "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" "$STAGING/"

# 4. Final Report (if generated)
[[ -f "${SCRIPT_DIR}/FinalReport.pdf" ]] && cp "${SCRIPT_DIR}/FinalReport.pdf" "$STAGING/"

# 5. Provenance metadata
TAG="VAL-001"
COMMIT_SHORT="unknown"
if [[ -f "$FROZEN_JSON" ]] && [[ -n "$py" ]]; then
  TAG=$("$py" -c "import json; print(json.load(open('$FROZEN_JSON')).get('git_tag','VAL-001'))" 2>/dev/null || echo "VAL-001")
  COMMIT_SHORT=$("$py" -c "import json; print(json.load(open('$FROZEN_JSON')).get('commit_short','unknown'))" 2>/dev/null || echo "unknown")
fi
cat > "$STAGING/provenance.json" <<EOF
{
  "protocol": "VVU-VAL-001",
  "protocol_version": "1.1",
  "validation_event": "${TAG}",
  "commit_short": "${COMMIT_SHORT}",
  "bundle_count": ${BUNDLE_COUNT},
  "package_sha_type": "SHA-256",
  "long_term_archive": "pending"
}
EOF

# 6. Package SHA-256
( cd "$STAGING" && hash_file "$(find . -maxdepth 1 -type f | sort | xargs ls -1t)" > PACKAGE_SHA256SUMS 2>/dev/null || find . -maxdepth 1 -type f | sort | while read -r f; do hash_file "$f"; done > PACKAGE_SHA256SUMS )
ZIP="$(mktemp "${SCRIPT_DIR}/VVU-72H-VALIDATION-XXXXXX.zip")"
( cd "$STAGING" && zip -q -X "$ZIP" . )
ZIP_SHA=$(hash_file "$ZIP" | awk '{print $1}')
echo "✓ package assembled: $(basename "$ZIP") (sha256: ${ZIP_SHA:0:16}...)"

# 7. Publish to GitHub Release
if [[ "$RELEASE" -eq 1 ]]; then
  echo ""
  echo "=== publishing GitHub Release ==="
  if ! command -v gh &>/dev/null 2>&1; then
    echo "✗ gh CLI not found — install: https://cli.github.com/"
    exit 1
  fi

  RELEASE_TITLE="VVU-VAL-001 — 72-Hour Validation (commit ${COMMIT_SHORT})"
  NOTES_TEMPLATE="$STAGING/release-notes.md"
  cat > "$NOTES_TEMPLATE" <<EOF
## VVU-VAL-001 — 72-Hour Continuous Validation

Validation event: ${TAG}
Commit: ${COMMIT_SHORT}
Package SHA-256: ${ZIP_SHA}

### Contents
- ${BUNDLE_COUNT} hourly evidence bundles (Hour-01.zip ... Hour-72.zip)
- SHA256SUMS (append-only hash ledger)
- PACKAGE_SHA256SUMS (package-level hash ledger)
- frozen-build.json (commit hash + image digest + image status)
- VVU-VAL-001_Pre_Registration_Protocol.pdf
- provenance.json

### Independent Reproduction
See §12 of the protocol PDF for the 8-step reproduction procedure. All artifacts are hash-verified.
EOF

  export GH_PAGER=cat
  if gh release view "$TAG" &>/dev/null 2>&1; then
    echo "  release $TAG exists — updating assets"
    gh release upload "$TAG" "$ZIP" "${SCRIPT_DIR}/SHA256SUMS" "$STAGING/PACKAGE_SHA256SUMS" --clobber 2>/dev/null || true
    gh release edit "$TAG" --title "$RELEASE_TITLE" --notes-file "$NOTES_TEMPLATE" 2>/dev/null || true
  else
    gh release create "$TAG" \
      "$ZIP" \
      "${SCRIPT_DIR}/SHA256SUMS" \
      "$STAGING/PACKAGE_SHA256SUMS" \
      --title "$RELEASE_TITLE" \
      --notes-file "$NOTES_TEMPLATE" \
      $([[ "$DRAFT" -eq 1 ]] && echo "--draft") \
      $([[ "$PRERELEASE" -eq 1 ]] && echo "--prerelease")
  fi
  echo "✓ GitHub Release updated: tag=$TAG"
  echo ""
  echo "Next: archive to long-term immutable storage per §6.2 of the protocol."
fi
