#!/usr/bin/env bash
set -euo pipefail

# diagnose-ci-root-cause.sh
# VVU Evidence Office — CI Failure Root‑Cause Analyzer
#
# Samples the last N failing GitHub Actions workflow runs, extracts
# normalized error signatures, and identifies the single most likely
# shared root cause.
#
# Requires: gh CLI authenticated, jq, GITHUB_REPOSITORY env var (or
#           passed as $1).
#
# Status: Specification complete — pending repository injection and
#         execution verification. Authorized in .manifest.json.

REPO="${GITHUB_REPOSITORY:-${1:-}}"
if [ -z "$REPO" ]; then
  echo "Usage: $0 <owner/repo>  or set GITHUB_REPOSITORY env var"
  exit 1
fi
N=${2:-20}
TMPDIR=$(mktemp -d /tmp/vvu-diag-XXXXXX)
trap 'rm -rf "$TMPDIR"' EXIT

echo "🔍 Pulling last $N failing workflow runs for $REPO..."

# Fetch run IDs for failed workflow runs (not individual jobs)
run_ids=$(gh run list --repo "$REPO" --status failure --limit "$N" \
  --json databaseId --jq '.[].databaseId' 2>/dev/null)

if [ -z "$run_ids" ]; then
  echo "✅ No failing runs found in the last $N. CI appears healthy."
  exit 0
fi

echo "📦 Downloading logs to $TMPDIR"
for id in $run_ids; do
  gh run view "$id" --repo "$REPO" --log > "$TMPDIR/$id.log" 2>/dev/null || true
done

echo ""
echo "🧬 Error signature extraction (first ERROR/FAIL line per run):"
echo "-----------------------------------------------------------------"
declare -A signatures
for f in "$TMPDIR"/*.log; do
  sig=$(grep -iE "error|fail|cannot find|missing|undefined|ENOENT|exit code [1-9]" "$f" | head -1 || true)
  short_id=$(basename "$f" .log)
  printf "%-12s %s\n" "$short_id" "${sig:-<no obvious error — inspect manually>}"
  if [ -n "$sig" ]; then
    # Normalize: remove timestamps, IDs, paths specific to the run
    norm_sig=$(echo "$sig" \
      | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9:Z]\+/TIMESTAMP/g' \
      | sed 's\/home\/runner\/work\/[^ ]*/PATH/g' \
      | sed 's/run id [0-9]\+/RUNID/g')
    signatures["$norm_sig"]=$(( ${signatures["$norm_sig"]:-0} + 1 ))
  fi
done

echo ""
echo "-----------------------------------------------------------------"
echo "📊 Signature frequency (normalized):"
max_count=0
root_cause=""
for sig in "${!signatures[@]}"; do
  count=${signatures[$sig]}
  printf "%-3d × %s\n" "$count" "$sig"
  if [ "$count" -gt "$max_count" ]; then
    max_count=$count
    root_cause="$sig"
  fi
done

echo ""
if [ -n "$root_cause" ]; then
  echo "🎯 ROOT CAUSE CANDIDATE (appears in $max_count/$N runs):"
  echo "   $root_cause"
else
  echo "⚠️  No dominant signature found. Consider increasing N or inspecting logs manually."
fi

echo ""
echo "💡 Common repo-wide checks (run these directly):"
echo "   gh secret list --repo $REPO"
echo "   cat .github/workflows/*.yml | grep 'node-version'"
echo "   git log -p --follow package-lock.json | head -50"
echo "   vercel env ls  # if applicable"
