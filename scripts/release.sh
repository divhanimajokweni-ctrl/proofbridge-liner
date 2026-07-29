#!/usr/bin/env bash
# ============================================================================
# release.sh — VVU Earth Tech Ledger Release Script
# ============================================================================
# Usage: ./scripts/release.sh [VERSION]
#   VERSION: Optional version string (e.g., "0.2.0"). If not provided, reads
#            from pyproject.toml.
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
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ---- Determine version ----
if [ -n "${1:-}" ]; then
    VERSION="$1"
else
    VERSION="$(grep '^version' "$LEDGER_DIR/pyproject.toml" | head -1 | sed 's/.*=.*"\(.*\)".*/\1/')"
fi

if [ -z "$VERSION" ]; then
    error "Could not determine version from pyproject.toml"
fi

TAG="v${VERSION}"
ARTIFACT_PREFIX="production_ledger-${VERSION}"

info "=== VVU Earth Tech Ledger Release ==="
info "Version: $VERSION"
info "Tag:     $TAG"
echo ""

# ---- Step 1: Validate git state ----
info "Step 1: Validating git state..."

# Check for uncommitted changes
if ! git diff --quiet 2>/dev/null; then
    error "Working tree has uncommitted changes. Commit or stash before releasing."
fi

if ! git diff --cached --quiet 2>/dev/null; then
    error "Index has uncommitted changes. Commit or stash before releasing."
fi

# Check for untracked files
UNTRACKED="$(git ls-files --others --exclude-standard "$PROJECT_ROOT")"
if [ -n "$UNTRACKED" ]; then
    warn "Untracked files found:"
    echo "$UNTRACKED"
    warn "Consider adding them before releasing."
    read -r -p "Continue anyway? [y/N] " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        error "Release aborted by user."
    fi
fi

# Check we're on main branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warn "Not on main branch (current: $CURRENT_BRANCH)"
    read -r -p "Continue anyway? [y/N] " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        error "Release aborted by user."
    fi
fi

# Check if tag already exists
if git tag -l "$TAG" | grep -q "$TAG"; then
    error "Tag $TAG already exists. Delete it or use a different version."
fi

info "Git state is clean."

# ---- Step 2: Run tests ----
info "Step 2: Running tests..."
cd "$LEDGER_DIR"

if [ -f "scripts/test.sh" ]; then
    bash scripts/test.sh
else
    python -m pytest tests/ -v --tb=short
fi

info "Tests passed."

# ---- Step 3: Build wheel and sdist ----
info "Step 3: Building wheel and sdist..."
rm -rf "$DIST_DIR"
python -m build

if [ ! -f "$DIST_DIR/${ARTIFACT_PREFIX}-py3-none-any.whl" ] && [ ! -f "$DIST_DIR/${ARTIFACT_PREFIX}.tar.gz" ]; then
    # Check for any wheel/sdist that was built
    if ls "$DIST_DIR"/*.whl 1>/dev/null 2>&1 && ls "$DIST_DIR"/*.tar.gz 1>/dev/null 2>&1; then
        info "Build artifacts found."
    else
        error "Build failed — no wheel or sdist found in $DIST_DIR"
    fi
fi

info "Build complete. Artifacts:"
ls -la "$DIST_DIR/"

# ---- Step 4: Generate SHA256SUMS ----
info "Step 4: Generating SHA256SUMS..."
cd "$DIST_DIR"
sha256sum *.whl *.tar.gz > SHA256SUMS
info "SHA256SUMS:"
cat SHA256SUMS

# ---- Step 5: Sign artifacts (if GPG available) ----
info "Step 5: Signing artifacts..."
if command -v gpg &>/dev/null; then
    gpg --detach-sign --armor SHA256SUMS
    info "Signed SHA256SUMS.asc created."
else
    warn "GPG not found. Skipping signing. Install GPG for release signing."
fi

# ---- Step 6: Create git tag ----
info "Step 6: Creating git tag $TAG..."
cd "$PROJECT_ROOT"
git tag -a "$TAG" -m "Release $TAG"

info "Tag $TAG created."

# ---- Step 7: Create GitHub release ----
info "Step 7: Creating GitHub release..."
if command -v gh &>/dev/null; then
    # Push tag first
    git push origin "$TAG" 2>/dev/null || warn "Could not push tag. Push manually: git push origin $TAG"

    # Create release
    gh release create "$TAG" \
        "$DIST_DIR"/*.whl \
        "$DIST_DIR"/*.tar.gz \
        "$DIST_DIR/SHA256SUMS" \
        ${DIST_DIR}/SHA256SUMS.asc \
        --title "Release $TAG" \
        --notes "## Release $TAG

### Artifacts
- Python wheel (\`.whl\`)
- Source distribution (\`.tar.gz\`)
- SHA256SUMS (checksums)
- SHA256SUMS.asc (GPG signature)

### Verification
\`\`\`bash
sha256sum -c SHA256SUMS
gpg --verify SHA256SUMS.asc SHA256SUMS
\`\`\`
" || warn "GitHub release creation failed. Create manually at: https://github.com/vvu-earth-tech/epistemic-dag-runtime/releases/new"

    info "GitHub release created."
else
    warn "GitHub CLI (gh) not found. Create release manually:"
    warn "  1. Push tag: git push origin $TAG"
    warn "  2. Create release: https://github.com/vvu-earth-tech/epistemic-dag-runtime/releases/new"
    warn "  3. Upload artifacts from $DIST_DIR/"
fi

# ---- Summary ----
echo ""
info "=== Release Complete ==="
info "Version: $VERSION"
info "Tag:     $TAG"
info "Artifacts:"
ls -la "$DIST_DIR/"
echo ""
info "Next steps:"
info "  1. Verify the release on GitHub"
info "  2. Upload to PyPI:  twine upload $DIST_DIR/*.whl $DIST_DIR/*.tar.gz"
info "  3. Announce the release"
