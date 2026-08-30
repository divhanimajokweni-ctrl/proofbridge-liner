#!/usr/bin/env bash
# VVU Monday Morning API Verification Cron Job Setup
# Runs vvu-auth-validator.py every Monday at 08:00 AM

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# Add cron job
(crontab -l 2>/dev/null | grep -v "vvu-auth-validator"; echo "0 8 * * 1 cd $SCRIPT_DIR && /usr/bin/python3 scripts/vvu-auth-validator.py >> $LOG_DIR/cron_auth_check.log 2>&1") | crontab -

echo "✓ Cron job installed: Monday 08:00 AM API verification"
echo "  Log file: $LOG_DIR/cron_auth_check.log"
echo ""
echo "To verify: crontab -l"
echo "To read logs: cat $LOG_DIR/cron_auth_check.log"
