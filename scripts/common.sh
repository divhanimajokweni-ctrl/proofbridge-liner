#!/usr/bin/env bash
# common.sh — shared shell utilities for VVU CI tools
# Source this file in other scripts:  source "$(dirname "$0")/common.sh"

vvu_log() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"; }
ensure_gh_auth() {
  if ! gh auth status &>/dev/null; then
    vvu_log "ERROR: gh not authenticated. Run 'gh auth login'."
    exit 1
  fi
}
