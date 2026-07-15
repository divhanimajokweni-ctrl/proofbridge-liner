#!/bin/bash
# Shared utilities for VVU Trust Chain

log() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')] $1"
}

error() {
  log "ERROR: $1" >&2
  exit 1
}

# Sign a file
sign_file() {
  # Implementation depends on the crypto package
  node packages/trust-crypto/dist/sign.js "$1" --key "$2" > "$1.sig"
}
