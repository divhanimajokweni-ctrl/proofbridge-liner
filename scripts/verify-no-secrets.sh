#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# verify-no-secrets.sh — Scan the repository for leaked secrets
#
# Scans all tracked files for common secret patterns including:
#   - AWS Access Key IDs and Secret Access Keys
#   - Private keys (PEM, OpenSSH, etc.)
#   - JWTs (JSON Web Tokens)
#   - Passwords in config files
#   - Generic API keys and tokens
#   - Database connection strings with credentials
#
# Exclusions:
#   - .env.example (template with placeholder values)
#   - Documentation files (*.md)
#   - Test fixtures (tests/**, __tests__/**)
#   - This script itself
#   - Generated certificate files (certs/**)
#   - Lock files
#
# Exit codes:
#   0 — No secrets detected
#   1 — Potential secrets found (review required)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FINDINGS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Secret Detection Scan ==="
echo "Repository: ${REPO_ROOT}"
echo ""

# ─── Exclusion Patterns ─────────────────────────────────────────────────────
EXCLUDE_DIRS=(
  "--glob=!.git/**"
  "--glob=!node_modules/**"
  "--glob=!certs/**"
  "--glob=!*.lock"
  "--glob=!bun.lock"
  "--glob=!package-lock.json"
  "--glob=!*.db"
  "--glob=!*.db-journal"
  "--glob=!tool-results/**"
  "--glob=!disposable-storage/**"
  "--glob=!audit-results/**"
)

EXCLUDE_FILES=(
  "--glob=!.env.example"
  "--glob=!verify-no-secrets.sh"
  "--glob=!generate-certs.sh"
  "--glob=!KeyRotation.md"
  "--glob=!ValidatorBootstrap.md"
  "--glob=!Observability.md"
  "--glob=!threat-model.md"
  "--glob=!operator-runbook.md"
  "--glob=!push-to-main.sh"
)

# ─── Pattern Definitions ────────────────────────────────────────────────────
# Each pattern is: "label|regex"
PATTERNS=(
  "AWS Access Key ID|AKIA[0-9A-Z]{16}"
  "AWS Secret Access Key|(?i)aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{40}"
  "Private Key (PEM header)|-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
  "JWT Token|eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+"
  "Password in config|(?i)(?:password|passwd|pwd)\s*[=:]\s*[^\s$]{8,}"
  "Generic API Key|(?i)(?:api[_-]?key|apikey)\s*[=:]\s*[A-Za-z0-9\-_]{20,}"
  "Generic Secret|(?i)(?:secret|token)\s*[=:]\s*[A-Za-z0-9\-_]{20,}"
  "Database Connection String|(?i)(?:mongodb|postgres|mysql|redis)://[^\s\"']*:([^\s\"']*)@"
  "Bearer Token|(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*"
  "GitHub Token|gh[ps]_[A-Za-z0-9_]{36,}"
  "Slack Token|xox[baprs]-[0-9]{10,}-[0-9]{10,}-[0-9a-zA-Z]{24,}"
  "Google API Key|AIza[0-9A-Za-z\-_]{35}"
  "SendGrid API Key|SG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}"
)

# ─── Scan Function ──────────────────────────────────────────────────────────
scan_pattern() {
  local label="$1"
  local regex="$2"
  local matches

  matches=$(rg --no-heading --line-number \
    ${EXCLUDE_DIRS[@]} \
    ${EXCLUDE_FILES[@]} \
    --glob="!*.md" \
    --glob="!*.toml" \
    --glob="!*.json" \
    --glob="!tests/**" \
    --glob="!__tests__/**" \
    --glob="!*.test.ts" \
    --glob="!*.test.py" \
    --glob="!*.spec.ts" \
    --type-add 'cert:*.crt' --type-add 'cert:*.pem' --type-add 'cert:*.key' \
    --type-not cert \
    "${regex}" "${REPO_ROOT}" 2>/dev/null || true)

  if [[ -n "${matches}" ]]; then
    echo -e "${RED}[FOUND] ${label}${NC}"
    echo "${matches}" | head -20
    echo ""
    FINDINGS=$((FINDINGS + 1))
  else
    echo -e "${GREEN}[OK] ${label}${NC}"
  fi
}

# ─── Run Scans ──────────────────────────────────────────────────────────────
echo "Scanning for secret patterns..."
echo ""

for pattern in "${PATTERNS[@]}"; do
  label="${pattern%%|*}"
  regex="${pattern#*|}"
  scan_pattern "${label}" "${regex}"
done

# ─── Additional Checks ──────────────────────────────────────────────────────
echo ""
echo "Additional checks..."

# Check for .env files (not .env.example)
echo -e "${YELLOW}[CHECK] .env files (should not be committed)${NC}"
env_files=$(rg --files "${REPO_ROOT}" --glob='.env' --glob='!.env.example' 2>/dev/null || true)
if [[ -n "${env_files}" ]]; then
  echo -e "${RED}[FOUND] .env files detected:${NC}"
  echo "${env_files}"
  FINDINGS=$((FINDINGS + 1))
else
  echo -e "${GREEN}[OK] No .env files found${NC}"
fi

# Check for .pem or .key files outside certs/ directory
echo -e "${YELLOW}[CHECK] Key/PEM files outside certs/ directory${NC}"
key_files=$(rg --files "${REPO_ROOT}" \
  --glob='*.pem' --glob='*.key' --glob='*.p12' --glob='*.pfx' \
  --glob='!certs/**' --glob='!disposable-storage/**' 2>/dev/null || true)
if [[ -n "${key_files}" ]]; then
  echo -e "${RED}[FOUND] Key files outside certs/:${NC}"
  echo "${key_files}"
  FINDINGS=$((FINDINGS + 1))
else
  echo -e "${GREEN}[OK] No key files outside certs/${NC}"
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "=== Scan Summary ==="

if [[ ${FINDINGS} -eq 0 ]]; then
  echo -e "${GREEN}No secrets detected. Repository is clean.${NC}"
  exit 0
else
  echo -e "${RED}${FINDINGS} potential secret(s) detected. Review the findings above.${NC}"
  echo ""
  echo "If these are false positives (e.g., test fixtures, documentation examples),"
  echo "add them to the exclusion list in this script."
  exit 1
fi
