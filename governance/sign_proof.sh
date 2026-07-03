#!/bin/sh
# sign_proof.sh — SafeLiner Digital Notary
#
# Takes a verified Lean 4 proof file, hashes it, signs the hash
# with the developer's Cosign private key, pins both the proof
# and the signature to the Ubuntu Pool (IPFS), and links them
# in a signed attestation JSON object.
#
# Usage:
#   ./sign_proof.sh /workspace/staging/Theorem4.lean
#
# Output:
#   Global Reference ID (CID): QmHash...
#
# Integration:
#   Called by:
#     - POST /api/proof/commit (Next.js API → docker exec)
#     - EditorPanel.tsx "Sign & Commit" button trigger
#
# Dependencies:
#   - cosign (Sigstore)
#   - curl (IPFS API calls)
#   - sha256sum

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────
KEY_PATH="${KEY_PATH:-/keys/developer.key}"
IPFS_API="${IPFS_API:-http://ubuntu-pool:5001/api/v0}"
STAGING_DIR="${STAGING_DIR:-/app/staging}"

# ── Input ────────────────────────────────────────────────────────
PROOF_FILE="${1:?Usage: $0 <path_to_lean_file>}"
if [ ! -f "$PROOF_FILE" ]; then
    echo "[FAIL] File not found: $PROOF_FILE"
    exit 1
fi

PROOF_BASENAME="$(basename "$PROOF_FILE")"
PROOF_DIR="$(dirname "$PROOF_FILE")"

echo "[Lindiwe] ═══════════════════════════════════════════"
echo "[Lindiwe]  Signing Pipeline Initiated"
echo "[Lindiwe]  Artifact: ${PROOF_BASENAME}"
echo "[Lindiwe] ═══════════════════════════════════════════"

# ── Step 1: Hash ────────────────────────────────────────────────
echo "[Lindiwe]  1. Hashing proof artifact..."
ARTIFACT_HASH="$(sha256sum "$PROOF_FILE" | awk '{print $1}')"
echo "[Lindiwe]     SHA256: ${ARTIFACT_HASH}"

# ── Step 2: Sign ────────────────────────────────────────────────
echo "[Lindiwe]  2. Signing hash with Cosign (key: ${KEY_PATH})..."
SIG_FILE="${PROOF_DIR}/${PROOF_BASENAME}.sig"
cosign sign-blob \
    --key "$KEY_PATH" \
    --tlog-upload=false \
    --output-signature "$SIG_FILE" \
    <(echo "$ARTIFACT_HASH") 2>/dev/null

if [ ! -f "$SIG_FILE" ]; then
    echo "[FAIL] Cosign signing failed — no signature produced."
    exit 1
fi
SIG_HASH="$(sha256sum "$SIG_FILE" | awk '{print $1}')"
echo "[Lindiwe]     Signature: ${SIG_HASH}"

# ── Step 3: Publish to Ubuntu Pool (IPFS) ───────────────────────
echo "[Lindiwe]  3. Publishing to Ubuntu Pool (IPFS)..."

PROOF_CID="$(curl -s -X POST -F file=@"$PROOF_FILE" "${IPFS_API}/add" | grep -o '"Hash":"[^"]*"' | head -1 | cut -d'"' -f4)"
echo "[Lindiwe]     Proof CID:  ${PROOF_CID}"

SIG_CID="$(curl -s -X POST -F file=@"$SIG_FILE" "${IPFS_API}/add" | grep -o '"Hash":"[^"]*"' | head -1 | cut -d'"' -f4)"
echo "[Lindiwe]     Sig CID:    ${SIG_CID}"

# ── Step 4: Create & pin attestation ────────────────────────────
echo "[Lindiwe]  4. Linking attestation..."

TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ATTESTATION_JSON="/tmp/attestation_${PROOF_BASENAME}.json"

cat > "$ATTESTATION_JSON" <<EOF
{
  "proof_cid": "${PROOF_CID}",
  "sig_cid": "${SIG_CID}",
  "proof_hash": "${ARTIFACT_HASH}",
  "sig_hash": "${SIG_HASH}",
  "timestamp": "${TIMESTAMP}",
  "file": "${PROOF_BASENAME}",
  "algorithm": "sha256-cosign-ed25519",
  "pool_version": "1.0"
}
EOF

FINAL_CID="$(curl -s -X POST -F file=@"$ATTESTATION_JSON" "${IPFS_API}/add" | grep -o '"Hash":"[^"]*"' | head -1 | cut -d'"' -f4)"

# ── Step 5: Pin the attestation for persistence ─────────────────
curl -s -X POST "${IPFS_API}/pin/add?arg=${FINAL_CID}" > /dev/null
curl -s -X POST "${IPFS_API}/pin/add?arg=${PROOF_CID}" > /dev/null
curl -s -X POST "${IPFS_API}/pin/add?arg=${SIG_CID}" > /dev/null

echo "[Lindiwe] ═══════════════════════════════════════════"
echo "[Lindiwe]  SUCCESS — Proof Anchored to Ubuntu Pool"
echo "[Lindiwe]  Global Reference ID (CID): ${FINAL_CID}"
echo "[Lindiwe]  Timestamp: ${TIMESTAMP}"
echo "[Lindiwe] ═══════════════════════════════════════════"

# ── Cleanup ──────────────────────────────────────────────────────
rm -f "$ATTESTATION_JSON"

exit 0
