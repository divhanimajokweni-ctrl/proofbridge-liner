#!/usr/bin/env bash
set -euo pipefail
detect_python() {
  if command -v python3 >/dev/null 2>&1; then echo python3; elif command -v python >/dev/null 2>&1; then echo python; else echo python3; fi
}
