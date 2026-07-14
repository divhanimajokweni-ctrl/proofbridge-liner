#!/usr/bin/env bash
# diagnose-ci-root-cause.sh
# VVU Evidence Office — Intelligent Failure Clustering
#
# Analyzes the last N failed workflow runs for a repository, clusters
# them by error message or failing step, and identifies the most
# "expensive" (frequent) bottleneck.
#
# Requires: gh CLI, jq, and a source'd common.sh.
#
# Status: Specification complete — pending repository injection and
#         execution verification.

source "$(dirname "$0")/common.sh"
ensure_gh_auth

REPO="${GITHUB_REPOSITORY:-${1:-}}"
if [ -z "$REPO" ]; then
  vvu_log "Usage: $0 <owner/repo> or set GITHUB_REPOSITORY env var"
  exit 1
fi
N=${2:-10}

vvu_log "🔍 Analyzing last $N failures for $REPO..."

# Fetch failed runs
failed_runs=$(gh api "repos/$REPO/actions/runs?status=failure&per_page=$N" --jq '.workflow_runs[] | {id: .id, name: .name, event: .event, created_at: .created_at}')

if [ -z "$failed_runs" ]; then
  vvu_log "✅ No recent failures found. Clean slate."
  exit 0
fi

# Iterate and extract failing steps
declare -A clusters
while read -r run; do
  run_id=$(echo "$run" | jq -r '.id')
  run_name=$(echo "$run" | jq -r '.name')
  
  # Get failing jobs for this run
  failing_job=$(gh api "repos/$REPO/actions/runs/$run_id/jobs" --jq '.jobs[] | select(.conclusion == "failure") | .name' | head -1)
  
  if [ -n "$failing_job" ]; then
    clusters["$failing_job"]=$(( ${clusters["$failing_job"]:-0} + 1 ))
    vvu_log "  Run $run_id ($run_name): failed at step '$failing_job'"
  fi
done <<< "$failed_runs"

# Output summary
vvu_log "📊 Failure Clustering Results:"
echo "| Failing Job/Step | Frequency |"
echo "|------------------|-----------|"
for job in "${!clusters[@]}"; do
  echo "| $job | ${clusters[$job]} |"
done | sort -t'|' -k3 -rn

# Identification of primary bottleneck
top_bottleneck=$(for job in "${!clusters[@]}"; do echo "${clusters[$job]} $job"; done | sort -rn | head -1 | cut -d' ' -f2-)

if [ -n "$top_bottleneck" ]; then
  vvu_log "🎯 Primary bottleneck identified: $top_bottleneck"
  vvu_log "Recommendation: Inspect logs for '$top_bottleneck' to address recurring failure."
fi
