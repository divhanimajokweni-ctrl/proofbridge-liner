#!/usr/bin/env bash
# ============================================================================
# checksums.sh — Generate, verify, and sign SHA256 checksums for release artifacts
# ============================================================================
# Usage: ./scripts/checksums.sh [COMMAND]
#   COMMANDS:
#     generate   Generate SHA256SUMS for all release artifacts (default)
#     verify     Verify existing SHA256SUMS
#     sign       Sign SHA256SUMS with GPG
#     verify-sig Verify GPG signature of SHA256SUMS
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LEDGER_DIR="$PROJECT_ROOT/vvu-earth-ledger"
DIST_DIR="$LEDGER_DIR/dist"

# ---- Color helpers ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ---- Commands ----

cmd_generate() {
    if [ ! -d "$DIST_DIR" ]; then
        error "No dist/ directory found. Run 'make build' or 'make release' first."
    fi

    # Check for release artifacts
    ARTIFACTS="$(find "$DIST_DIR" -maxdepth 1 \( -name "*.whl" -o -name "*.tar.gz" \) -type f)"
    if [ -z "$ARTIFACTS" ]; then
        error "No .whl or .tar.gz files found in $DIST_DIR. Run 'make build' first."
    fi

    info "Generating SHA256SUMS for release artifacts..."
    cd "$DIST_DIR"

    # Remove old checksums
    rm -f SHA256SUMS SHA256SUMS.asc

    # Generate checksums for all wheel and sdist files
    sha256sum *.whl *.tar.gz > SHA256SUMS

    info "SHA256SUMS generated:"
    cat SHA256SUMS

    # Also generate individual checksum files for each artifact
    for artifact in *.whl *.tar.gz; do
        if [ -f "$artifact" ]; then
            sha256sum "$artifact" > "${artifact}.sha256"
            info "  ${artifact}.sha256 created"
        fi
    done

    info "Checksum generation complete."
}

cmd_verify() {
    if [ ! -f "$DIST_DIR/SHA256SUMS" ]; then
        error "SHA256SUMS not found in $DIST_DIR. Run './scripts/checksums.sh generate' first."
    fi

    info "Verifying SHA256SUMS..."
    cd "$DIST_DIR"

    if sha256sum --check SHA256SUMS; then
        info "All checksums verified successfully."
    else
        error "Checksum verification FAILED! Artifacts may be corrupted."
    fi
}

cmd_sign() {
    if [ ! -f "$DIST_DIR/SHA256SUMS" ]; then
        error "SHA256SUMS not found in $DIST_DIR. Run './scripts/checksums.sh generate' first."
    fi

    if ! command -v gpg &>/dev/null; then
        error "GPG not found. Install GPG to sign artifacts: apt install gnupg"
    fi

    info "Signing SHA256SUMS with GPG..."
    cd "$DIST_DIR"

    # Remove old signature if present
    rm -f SHA256SUMS.asc

    # Sign the checksums file
    gpg --detach-sign --armor SHA256SUMS

    if [ -f SHA256SUMS.asc ]; then
        info "SHA256SUMS.asc signature created."
        info "Signature details:"
        gpg --verify SHA256SUMS.asc SHA256SUMS 2>&1 || true
    else
        error "Failed to create GPG signature."
    fi
}

cmd_verify_sig() {
    if [ ! -f "$DIST_DIR/SHA256SUMS.asc" ]; then
        error "SHA256SUMS.asc not found in $DIST_DIR. Run './scripts/checksums.sh sign' first."
    fi

    if ! command -v gpg &>/dev/null; then
        error "GPG not found. Install GPG to verify signatures."
    fi

    info "Verifying GPG signature..."
    cd "$DIST_DIR"

    if gpg --verify SHA256SUMS.asc SHA256SUMS; then
        info "GPG signature verified successfully."
    else
        error "GPG signature verification FAILED!"
    fi
}

# ---- Main ----

COMMAND="${1:-generate}"

case "$COMMAND" in
    generate)
        cmd_generate
        ;;
    verify)
        cmd_verify
        ;;
    sign)
        cmd_sign
        ;;
    verify-sig)
        cmd_verify_sig
        ;;
    *)
        echo "Usage: $0 [generate|verify|sign|verify-sig]"
        echo ""
        echo "  generate    Generate SHA256SUMS for all release artifacts (default)"
        echo "  verify      Verify existing SHA256SUMS"
        echo "  sign        Sign SHA256SUMS with GPG"
        echo "  verify-sig  Verify GPG signature of SHA256SUMS"
        exit 1
        ;;
esac
