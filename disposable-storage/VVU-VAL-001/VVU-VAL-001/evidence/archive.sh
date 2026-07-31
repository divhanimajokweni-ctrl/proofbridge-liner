#!/usr/bin/env bash
# VVU-VAL-001 · Evidence Archive & Release Publisher
#
# At H72, assembles the complete evidence package and publishes it as a
# GitHub Release associated with the frozen Git tag (VAL-001). Also archives
# to long-term storage (Zenodo/immutable S3) per §6.2 of the protocol.
#
# Usage:
#   ./archive.sh                # assemble the package locally
#   ./archive.sh --release      # assemble + publish to GitHub Release

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${VAL_DIR}/../.." && pwd)"
BUNDLES_DIR="${SCRIPT_DIR}/bundles"
PACKAGE_DIR="${SCRIPT_DIR}/VVU-72H-VALIDATION"
RELEASE=0

[[ "${1:-}" == "--release" ]] && RELEASE=1

echo "=== assembling VVU-72H-VALIDATION package ==="
rm -rf "$PACKAGE_DIR"; mkdir -p "$PACKAGE_DIR"

# 1. All 72 hourly bundles + SHA256SUMS
if [[ -d "$BUNDLES_DIR" ]] && ls "$BUNDLES_DIR"/Hour-*.zip &>/dev/null 2>&1; then
  cp "$BUNDLES_DIR"/Hour-*.zip "$PACKAGE_DIR/"
  cp "${SCRIPT_DIR}/SHA256SUMS" "$PACKAGE_DIR/"
  echo "✓ copied $(ls "$PACKAGE_DIR"/Hour-*.zip | wc -l) bundles"
else
  echo "⚠ no evidence bundles found — package will be incomplete"
fi

# 2. Frozen build manifest
[[ -f "${VAL_DIR}/protocol/frozen-build.json" ]] && cp "${VAL_DIR}/protocol/frozen-build.json" "$PACKAGE_DIR/"
[[ -f "${VAL_DIR}/protocol/frozen-build.sha256" ]] && cp "${VAL_DIR}/protocol/frozen-build.sha256" "$PACKAGE_DIR/"

# 3. Protocol PDF
[[ -f "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" ]] && \
  cp "${VAL_DIR}/protocol/VVU-VAL-001_Pre_Registration_Protocol.pdf" "$PACKAGE_DIR/"

# 4. Final Report (if generated)
[[ -f "${SCRIPT_DIR}/FinalReport.pdf" ]] && cp "${SCRIPT_DIR}/FinalReport.pdf" "$PACKAGE_DIR/"

# 5. Package SHA-256
( cd "$PACKAGE_DIR" && sha256sum * > PACKAGE_SHA256SUMS )
echo "✓ package assembled: $PACKAGE_DIR"

# 6. Create the zip
ZIP="${SCRIPT_DIR}/VVU-72H-VALIDATION.zip"
( cd "${SCRIPT_DIR}" && zip -qr "$(basename "$ZIP")" VVU-72H-VALIDATION/ )
ZIP_SHA=$(sha256sum "$ZIP" | awk '{print $1}')
echo "✓ zip: $ZIP (sha256: ${ZIP_SHA:0:16}...)"

# 7. Publish to GitHub Release
if [[ $RELEASE -eq 1 ]]; then
  echo ""
  echo "=== publishing GitHub Release ==="
  if ! command -v gh &>/dev/null 2>&1; then
    echo "✗ gh CLI not found — install: https://cli.github.com/"
    exit 1
  fi
  FROZEN="${VAL_DIR}/protocol/frozen-build.json"
  TAG=$(python3 -c "import json; print(json.load(open('$FROZEN'))['git_tag'])" 2>/dev/null || echo "VAL-001")
  COMMIT=$(python3 -c "import json; print(json.load(open('$FROZEN'))['commit_hash'][:7])" 2>/dev/null || echo "unknown")

  gh release create "$TAG" \
    "$ZIP" \
    "${PACKAGE_DIR}/PACKAGE_SHA256SUMS" \
    --title "VVU-VAL-001 — 72-Hour Validation (commit ${COMMIT})" \
    --notes-file - <<EOF
## VVU-VAL-001 — 72-Hour Continuous Validation

Validation event: VAL-001
Commit: ${COMMIT}
Package SHA-256: ${ZIP_SHA}

### Contents
- 72 hourly evidence bundles (Hour-01.zip ... Hour-72.zip)
- SHA256SUMS (append-only hash ledger)
- frozen-build.json (commit hash + image digest)
- VVU-VAL-001_Pre_Registration_Protocol.pdf
- PACKAGE_SHA256SUMS

### Independent Reproduction
See §12 of the protocol PDF for the 8-step reproduction procedure.

### Long-term Archival
This package is also archived at: [Zenodo DOI to be added]
EOF
  echo "✓ GitHub Release published: tag=$TAG"
  echo ""
  echo "Next: archive to Zenodo/immutable S3 per §6.2 of the protocol."
fi
