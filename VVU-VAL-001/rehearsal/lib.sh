#!/usr/bin/env bash
# VVU-VAL-001 · Rehearsal Shared Library
#
# This library is sourced by all rehearsal scripts. It provides:
#   - platform detection
#   - repository discovery
#   - cross-platform SHA-256 hashing
#   - logging helpers
#   - python probing
#   - replay hour mapping
#   - validation index computation
#
# Usage:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

set -euo pipefail

# ── Platform detection ──────────────────────────────────────────────────────

detect_os() {
  case "$(uname -s || echo unknown)" in
    Linux)  echo linux ;;
    Darwin) echo macos ;;
    MINGW*|MSYS*|CYGWIN*) echo windows ;;
    *)      echo unknown ;;
  esac
}

detect_arch() {
  uname -m 2>/dev/null || echo unknown
}

# ── Repository discovery ────────────────────────────────────────────────────

normalize_path() {
  # Normalize MSYS-style /c/... to C:/... for git -C on Windows Git Bash
  local p="$1"
  if [[ "$p" == /c/* ]]; then
    p="C:${p#/c}"
  fi
  echo "$p"
}

git_root() {
  # Return the repository root from any path under the repo.
  # Tries git -C first, then falls back to walking up.
  local dir="${1:-.}"
  local root
  if root="$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null)"; then
    normalize_path "$root"
    return 0
  fi
  # Fallback: walk up to nearest .git
  local d="$dir"
  while [[ "$d" != "/" && "$d" != "." ]]; do
    if [[ -d "$d/.git" ]]; then
      normalize_path "$(cd "$d" && pwd)"
      return 0
    fi
    d="$(dirname "$d")"
  done
  echo ""
  return 1
}

detect_python() {
  # Return a working python command, or empty string.
  if command -v python3 &>/dev/null; then
    echo python3
  elif command -v python &>/dev/null; then
    echo python
  else
    echo ""
  fi
}

# ── Hashing ─────────────────────────────────────────────────────────────────

hash_file() {
  if [[ $# -lt 1 ]]; then
    fatal "hash_file requires a path argument"
  fi
  local f="$1"
  if [[ ! -f "$f" ]]; then
    fatal "hash_file: $f does not exist"
  fi
  if command -v sha256sum &>/dev/null; then
    sha256sum "$f"
  elif command -v shasum &>/dev/null; then
    shasum -a 256 "$f"
  else
    fatal "No SHA-256 implementation found. Install coreutils or lib digest."
  fi
}

# ── Logging ──────────────────────────────────────────────────────────────────

info()  { echo "[info] $*"; }
warn()  { echo "[warn] $*" >&2; }
fatal() { echo "[fatal] $*" >&2; exit 2; }

# ── Validation Index ────────────────────────────────────────────────────────

validation_index() {
  local metrics_file="$1"
  local format="${2:-text}"
  local py
  py="$(detect_python)"
  [[ -z "$py" ]] && fatal "python is required for validation-index computation"
  "$py" "${VVU_EVIDENCE_DIR:-}/validation-index.py" --metrics "$metrics_file" ${format:+--json}
}

# ── Replay schedule ─────────────────────────────────────────────────────────

replay_hours() {
  # Deterministic replay sample hours for each phase
  echo "12 24 36 48 60 66 72"
}

# ── Phase → hour mapping ────────────────────────────────────────────────────

phase_to_hour() {
  case "${1:-}" in
    P1) echo 12 ;; P2) echo 24 ;; P3) echo 36 ;;
    P4) echo 48 ;; P5) echo 60 ;; P6) echo 66 ;; P7) echo 72 ;;
    *)   echo "" ;;
  esac
}

# ── Image status constants ──────────────────────────────────────────────────

readonly IMAGE_STATUS_BUILT="BUILT"
readonly IMAGE_STATUS_PINNED="PINNED"
readonly IMAGE_STATUS_SKIPPED="SKIPPED"
readonly IMAGE_STATUS_NOT_AVAILABLE="NOT_AVAILABLE"
