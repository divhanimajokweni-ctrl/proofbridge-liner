#!/usr/bin/env bash
# audit-commit-fabrication.sh
# VVU Evidence Office — DEPLOY_LOG.md Fabrication Auditor
#
# Compares the deployment claims in DEPLOY_LOG.md against the actual
# GitHub Actions workflow conclusion for the last N commits. Outputs JSON
# and Markdown reports, generates a SHA‑256 evidence hash, and optionally
# signs with Ed25519 using the repository's own trust‑crypto package.
#
# Requires: gh CLI, jq, git, and a built packages/trust-crypto (for signing).

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-${1:-}}"
if [ -z "$REPO" ]; then
  echo "Usage: $0 <owner/repo>  or set GITHUB_REPOSITORY env var"
  exit 1
fi
N=${2:-20}
OUTPUT_JSON="${3:-audit-report.json}"
EVIDENCE_HASH_FILE="${4:-audit-evidence.sha256}"

# Helper: determine the overall CI conclusion for a commit.
get_ci_conclusion() {
  local sha="$1"
  local wf_conclusion
  wf_conclusion=$(gh api "repos/$REPO/actions/runs?head_sha=$sha&per_page=1" \
    --jq '.workflow_runs[0].conclusion' 2>/dev/null || true)
  if [ -n "$wf_conclusion" ] && [ "$wf_conclusion" != "null" ]; then
    echo "$wf_conclusion"
    return
  fi
  local check_conclusions
  check_conclusions=$(gh api "repos/$REPO/commits/$sha/check-suites" \
    --jq '.check_suites[] | select(.conclusion != null) | .conclusion' 2>/dev/null)
  if echo "$check_conclusions" | grep -q "failure"; then
    echo "failure"
  elif echo "$check_conclusions" | grep -q "success" && ! echo "$check_conclusions" | grep -q "failure"; then
    echo "success"
  else
    echo "unknown"
  fi
}

commits=$(git log --format="%H" -n "$N" 2>/dev/null || echo "")
if [ -z "$commits" ]; then
  echo "No commits found. Exiting."
  exit 1
fi

declare -a results
for sha in $commits; do
  short=${sha:0:8}
  ci_outcome=$(get_ci_conclusion "$sha")
  claim=$(grep -A1 "$short" DEPLOY_LOG.md 2>/dev/null | grep -iE "status|pipeline|deploy|pass|fail" | head -1 || true)
  claim_text="${claim:--}"

  flag=""
  if [ "$ci_outcome" = "failure" ] && echo "$claim_text" | grep -qiE "pass|deploy|success"; then
    flag="FABRICATION"
  fi

  results+=("$(jq -n \
    --arg sha "$short" \
    --arg ci "$ci_outcome" \
    --arg claim "$claim_text" \
    --arg flag "$flag" \
    '{commit: $sha, ci_status: $ci, deploy_log_claim: $claim, flag: $flag}')")
done

printf '%s\n' "${results[@]}" > "$OUTPUT_JSON.tmp"
jq -s '.' "$OUTPUT_JSON.tmp" > "$OUTPUT_JSON"
rm "$OUTPUT_JSON.tmp"

fabrications=$(jq '[.[] | select(.flag == "FABRICATION")] | length' "$OUTPUT_JSON")
echo "📊 Audit complete. $fabrications fabrication(s) detected. Report: $OUTPUT_JSON"

echo "| Commit | CI Status | DEPLOY_LOG.md Claim | Flag |" > audit-summary.md
echo "|--------|-----------|---------------------|------|" >> audit-summary.md
jq -r '.[] | "| \(.commit) | \(.ci_status) | \(.deploy_log_claim) | \(.flag) |"' "$OUTPUT_JSON" >> audit-summary.md
echo "📝 Markdown summary: audit-summary.md"

sha256sum "$OUTPUT_JSON" > "$EVIDENCE_HASH_FILE"
echo "🔐 Evidence hash written to $EVIDENCE_HASH_FILE"

TRUST_CRYPTO_SIGN="packages/trust-crypto/dist/sign.js"
if [ -f "$TRUST_CRYPTO_SIGN" ]; then
  node "$TRUST_CRYPTO_SIGN" "$OUTPUT_JSON" > "$OUTPUT_JSON.sig" 2>/dev/null && \
    echo "✍️  Ed25519 signature: $OUTPUT_JSON.sig" || \
    echo "⚠️  Signing failed — check trust-crypto package build."
else
  echo "ℹ️  trust‑crypto package not built — skipping signature (run 'npm run build' in packages/trust-crypto)."
fi
