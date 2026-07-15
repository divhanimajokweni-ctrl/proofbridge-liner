#!/bin/bash
# DEPLOY_LOG.md fabrication auditor
source ./scripts/common.sh

log "Running fabrication audit on DEPLOY_LOG.md..."
# Check for fabricated entries
if grep -q "fabricated" DEPLOY_LOG.md; then
  error "Fabrication detected in DEPLOY_LOG.md!"
else
  log "No fabrication detected."
fi
