# VVU Earth Tech Ledger — Operations Runbook

## 1. Introduction

This runbook covers Day-2 operations for the VVU Earth Tech Ledger: health checks, backup procedures, disaster recovery, key rotation, certificate rotation, database maintenance, monitoring alerts, incident response, and capacity planning.

## 2. Health Checks

### 2.1 API Health Check

```bash
curl -s http://localhost:50051/health | jq .
```

Expected response:
```json
{
    "status": "ok",
    "service": "production-ledger"
}
```

### 2.2 Ledger Statistics

```bash
curl -s http://localhost:50051/stats | jq .
```

Key fields to verify:
- `sequence`: Should be monotonically increasing
- `mmr_size`: Should equal `sequence + 1`
- `is_open`: Should be `true`
- `db_stats.journal_mode`: Should be `wal`
- `db_stats.synchronous`: Should be `2` (FULL)

### 2.3 Database Integrity Check

```bash
python -m production_ledger serve --config /etc/ledger/config.toml
# Then in another terminal:
sqlite3 /data/ledger.db "PRAGMA integrity_check;"
```

Expected: `ok`

### 2.4 Chain Verification

```bash
python -m production_ledger verify --config /etc/ledger/config.toml
```

Expected: `Chain verification: PASSED`

### 2.5 Full Replay Verification

```bash
python -m production_ledger replay --config /etc/ledger/config.toml --verbose
```

Expected: `Replay result: SUCCESS`

## 3. Backup Procedures

### 3.1 Online Backup (CLI)

```bash
python -m production_ledger backup --config /etc/ledger/config.toml --output /backups/ledger_$(date +%Y%m%d_%H%M%S).db
```

### 3.2 Manual Backup (SQLite)

```bash
# Checkpoint the WAL first
sqlite3 /data/ledger.db "PRAGMA wal_checkpoint(TRUNCATE);"

# Copy the database file
cp /data/ledger.db /backups/ledger_$(date +%Y%m%d_%H%M%S).db

# Copy WAL and SHM files
cp /data/ledger.db-wal /backups/ 2>/dev/null || true
cp /data/ledger.db-shm /backups/ 2>/dev/null || true
```

### 3.3 Snapshot Backup

```bash
python -m production_ledger snapshot --config /etc/ledger/config.toml --export /backups/snapshot_$(date +%Y%m%d_%H%M%S).snap
```

### 3.4 Automated Backup Script

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONFIG="/etc/ledger/config.toml"

# Create backup
python -m production_ledger backup --config "$CONFIG" --output "$BACKUP_DIR/ledger_$TIMESTAMP.db"

# Verify backup integrity
sqlite3 "$BACKUP_DIR/ledger_$TIMESTAMP.db" "PRAGMA integrity_check;" | grep -q "ok" || {
    echo "ERROR: Backup integrity check failed!"
    exit 1
}

# Delete old backups
find "$BACKUP_DIR" -name "ledger_*.db" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: ledger_$TIMESTAMP.db"
```

### 3.5 Backup Schedule

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database | Daily | 30 days |
| Snapshot | Weekly | 90 days |
| WAL checkpoint | Every 4 hours | — |

## 4. Disaster Recovery

### 4.1 Recovery from Backup

```bash
# 1. Stop the ledger service
sudo systemctl stop ledger

# 2. Verify the backup
sqlite3 /backups/ledger_20260304_120000.db "PRAGMA integrity_check;"

# 3. Restore the backup
python -m production_ledger restore --config /etc/ledger/config.toml --input /backups/ledger_20260304_120000.db

# 4. Start the ledger service
sudo systemctl start ledger

# 5. Verify the restored ledger
python -m production_ledger verify --config /etc/ledger/config.toml
python -m production_ledger replay --config /etc/ledger/config.toml
```

### 4.2 Recovery from Snapshot

```bash
# 1. Stop the ledger service
sudo systemctl stop ledger

# 2. Import the snapshot
python -c "
from production_ledger.config import LedgerConfig
from production_ledger.ledger import Ledger
from production_ledger.snapshots import SnapshotManager

config = LedgerConfig.default()
ledger = Ledger(config)
ledger.open()
ledger._snapshot_manager.import_snapshot('/backups/snapshot_20260304.snap')
ledger.close()
"

# 3. Start the ledger service
sudo systemctl start ledger

# 4. Verify the restored ledger
python -m production_ledger replay --config /etc/ledger/config.toml
```

### 4.3 Recovery from WAL Corruption

```bash
# 1. Stop the ledger service
sudo systemctl stop ledger

# 2. Attempt WAL checkpoint
sqlite3 /data/ledger.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 3. If checkpoint fails, delete WAL and SHM
rm -f /data/ledger.db-wal /data/ledger.db-shm

# 4. Verify database integrity
sqlite3 /data/ledger.db "PRAGMA integrity_check;"

# 5. Start the ledger service
sudo systemctl start ledger

# 6. Run replay verification
python -m production_ledger replay --config /etc/ledger/config.toml
```

### 4.4 Complete Data Loss

In the event of complete data loss:

1. Restore from the most recent backup
2. If no backup is available, re-initialize the ledger
3. Re-register validators
4. Re-append any missing entries (if available from replication or other sources)

## 5. Key Rotation

### 5.1 When to Rotate Keys

| Trigger | Action |
|---------|--------|
| Key age > 90 days | Scheduled rotation |
| Key suspected compromise | Emergency rotation |
| Validator departure | Revoke and rotate |
| Compliance requirement | As specified |

### 5.2 Rotating the Ledger Signing Key

```bash
python -m production_ledger rotate-key --config /etc/ledger/config.toml
```

Output:
```
Key rotated:
  Key ID    : a1b2c3d4
  Version   : 2
  Public key: <hex-encoded 32 bytes>
```

### 5.3 Rotating a Validator Key

```bash
python -m production_ledger validators --rotate <old-key-id-hex> --config /etc/ledger/config.toml
```

### 5.4 Emergency Key Revocation

```bash
python -m production_ledger validators --revoke <key-id-hex> --config /etc/ledger/config.toml
```

## 6. Certificate Rotation

### 6.1 Server Certificate Rotation

```bash
# 1. Generate new server certificate
openssl genrsa -out /etc/ledger/certs/server.key 2048
openssl req -new -key /etc/ledger/certs/server.key -out /tmp/server.csr
openssl x509 -req -in /tmp/server.csr -CA /etc/ledger/certs/ca.crt \
    -CAkey /etc/ledger/certs/ca.key -CAcreateserial \
    -out /etc/ledger/certs/server.crt -days 365 -sha256

# 2. Set correct permissions
chmod 600 /etc/ledger/certs/server.key
chmod 644 /etc/ledger/certs/server.crt

# 3. Restart the ledger service
sudo systemctl restart ledger

# 4. Verify the new certificate
openssl s_client -connect localhost:50051 -showcerts < /dev/null 2>/dev/null | \
    openssl x509 -noout -dates
```

### 6.2 CA Certificate Rotation

CA rotation is more complex and requires:

1. Generate new CA key and certificate
2. Re-issue all server and client certificates
3. Update all clients to trust the new CA
4. Restart all services

### 6.3 Certificate Monitoring

```bash
# Check certificate expiry
openssl x509 -in /etc/ledger/certs/server.crt -noout -enddate

# Alert if certificate expires within 30 days
EXPIRY=$(openssl x509 -in /etc/ledger/certs/server.crt -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_UNTIL=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

if [ "$DAYS_UNTIL" -lt 30 ]; then
    echo "WARNING: Certificate expires in $DAYS_UNTIL days"
fi
```

## 7. Database Maintenance

### 7.1 WAL Checkpoint

```bash
sqlite3 /data/ledger.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

Run when:
- WAL file exceeds 100 MB
- Before backup operations
- Before database size analysis

### 7.2 VACUUM

```bash
sqlite3 /data/ledger.db "VACUUM;"
```

Run when:
- Free pages exceed 10% of total pages
- After large-scale data deletion
- Monthly as part of routine maintenance

### 7.3 Integrity Check

```bash
sqlite3 /data/ledger.db "PRAGMA integrity_check;"
```

Run when:
- Daily as part of health checks
- After any suspected corruption
- After restoring from backup

### 7.4 Database Statistics

```bash
sqlite3 /data/ledger.db "PRAGMA page_count; PRAGMA freelist_count; PRAGMA page_size;"
```

### 7.5 Maintenance Schedule

| Task | Frequency | Estimated Duration |
|------|-----------|-------------------|
| WAL checkpoint | Every 4 hours | < 1 second |
| Integrity check | Daily | < 30 seconds |
| VACUUM | Monthly | < 5 minutes |
| Full replay | Weekly | < 30 minutes |
| Backup | Daily | < 5 minutes |

## 8. Monitoring Alerts

### 8.1 Critical Alerts

| Alert | Condition | Response |
|-------|-----------|----------|
| Ledger Down | `up{job="ledger"} == 0` for 1m | Restart service; investigate |
| Integrity Check Failed | `integrity_check != "ok"` | Immediate investigation; restore from backup |
| Replay Verification Failed | Replay violations > 0 | Investigate tampering; restore from backup |

### 8.2 Warning Alerts

| Alert | Condition | Response |
|-------|-----------|----------|
| High Append Latency | `append_duration_seconds` p99 > 1s | Check disk I/O; increase cache_size |
| Database Growing Rapidly | `page_count` increasing > 10%/day | Investigate append rate |
| WAL File Large | WAL file > 100 MB | Run checkpoint |
| Validator Count Low | `validator_count` < 2 | Register more validators |
| Certificate Expiring | Certificate expires in < 30 days | Rotate certificate |
| Key Age > 90 days | Key not rotated in 90 days | Rotate key |

### 8.3 Informational Alerts

| Alert | Condition | Response |
|-------|-----------|----------|
| Backup Completed | Daily backup successful | No action |
| Replay Completed | Weekly replay successful | No action |
| Key Rotated | Key rotation performed | Update configuration |

## 9. Incident Response

### 9.1 Incident Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 — Critical | Data loss, corruption, or security breach | Immediate |
| P2 — High | Service unavailable, major performance degradation | < 30 minutes |
| P3 — Medium | Minor performance issues, non-critical alerts | < 4 hours |
| P4 — Low | Informational alerts, routine maintenance | Next business day |

### 9.2 Incident Response Procedures

#### P1: Data Loss or Corruption

1. **Stop the service**: `sudo systemctl stop ledger`
2. **Assess the damage**: Run `PRAGMA integrity_check` and replay verification
3. **Identify the cause**: Check logs, disk status, and recent changes
4. **Restore from backup**: Follow the disaster recovery procedure
5. **Verify the restoration**: Run replay verification
6. **Document the incident**: Record the timeline, root cause, and resolution
7. **Prevent recurrence**: Implement additional safeguards

#### P1: Security Breach

1. **Stop the service**: `sudo systemctl stop ledger`
2. **Revoke compromised keys**: `python -m production_ledger validators --revoke <key-id>`
3. **Rotate all keys**: `python -m production_ledger rotate-key`
4. **Assess the impact**: Run replay verification to check for tampering
5. **Report the breach**: Follow organizational security incident procedures
6. **Document the incident**: Record the timeline, scope, and resolution

#### P2: Service Unavailable

1. **Check the service status**: `sudo systemctl status ledger`
2. **Check the logs**: `sudo journalctl -u ledger -n 100`
3. **Check the database**: `sqlite3 /data/ledger.db "PRAGMA integrity_check;"`
4. **Restart the service**: `sudo systemctl restart ledger`
5. **Verify the service**: `curl http://localhost:50051/health`
6. **If still failing**: Escalate to P1

### 9.3 Incident Log Template

```
Date: YYYY-MM-DD
Time: HH:MM:SS
Severity: P1/P2/P3/P4
Description: <brief description>
Impact: <what was affected>
Root Cause: <what caused the incident>
Resolution: <how was it resolved>
Prevention: <what will be done to prevent recurrence>
```

## 10. Capacity Planning

### 10.1 Growth Estimation

| Metric | Formula | Example |
|--------|---------|---------|
| Daily entries | Count of appends per day | 10,000 |
| Daily database growth | Entries × avg_entry_size | 10,000 × 1 KB = 10 MB/day |
| Monthly database growth | Daily growth × 30 | 300 MB/month |
| Annual database growth | Monthly growth × 12 | 3.6 GB/year |

### 10.2 Resource Requirements

| Scale | CPU | Memory | Disk | Network |
|-------|-----|--------|------|---------|
| Small (< 1K entries/day) | 1 core | 512 MB | 10 GB | 10 Mbps |
| Medium (< 100K entries/day) | 2 cores | 2 GB | 100 GB | 100 Mbps |
| Large (< 1M entries/day) | 4 cores | 4 GB | 500 GB | 1 Gbps |

### 10.3 Scaling Checklist

- [ ] Monitor append rate and latency trends
- [ ] Monitor database size growth
- [ ] Plan storage expansion before 80% utilization
- [ ] Schedule VACUUM for databases > 10 GiB
- [ ] Consider archiving old entries for databases > 50 GiB
- [ ] Review and adjust cache_size for read-heavy workloads
- [ ] Review and adjust busy_timeout for write-heavy workloads

## 11. Common Operations

### 11.1 List Active Validators

```bash
python -m production_ledger validators --config /etc/ledger/config.toml
```

### 11.2 Create a Snapshot

```bash
python -m production_ledger snapshot --config /etc/ledger/config.toml
```

### 11.3 Generate an Inclusion Proof

```bash
python -m production_ledger proof --seq 42 --config /etc/ledger/config.toml
```

### 11.4 View Metrics

```bash
python -m production_ledger metrics --config /etc/ledger/config.toml
```

### 11.5 Run Migrations

```bash
# Apply pending migrations
python -m production_ledger migrate --config /etc/ledger/config.toml

# Rollback to specific version
python -m production_ledger migrate --down --to 2 --config /etc/ledger/config.toml
```
