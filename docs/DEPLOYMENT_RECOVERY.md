# Deployment Recovery — Stuck `deploying` State

## Symptom
`VVU-VAL-001/release/deployment-record.json` shows `"status": "deploying"` for
longer than the expected build window. Baseline: treat >15 minutes as anomalous.

## Cause
`/api/app-state` derives lifecycle state from `deployment-record.json` as an
immutable artifact (Gate D, PASS). If the process writing this file crashes or
is killed mid-deploy, the file is never updated past `"deploying"`, and there
is no local mechanism to detect divergence from actual deployment state.

## Procedure
1. Run `scripts/diagnose-stuck-deployment.sh` — never reset blind.
2. If Vercel confirms `READY`, `ERROR`, or `CANCELED`: run
   `scripts/recover-stuck-deployment.sh`. It backs up the record before
   mutating it.
3. If Vercel confirms `BUILDING`/`QUEUED`/`INITIALIZING`: **do not reset**.
   The deployment is active, not stuck. Investigate via `vercel logs <id>`.
4. If Vercel API is unreachable: escalate — do not guess at state from the
   local record alone, since the local record is exactly what's unreliable.

## Safety guarantees
- Recovery script backs up before mutation: `.bak.<timestamp>`
- Recovery script only acts on terminal remote states; active states are refused
- Recovery script requires non-empty deployment ID to prevent blind resets

## Prevention (structural fix — recommended)
The root defect is that `deployment-record.json` has no heartbeat/TTL and no
reconciliation loop against the deploy provider. Add a scheduled GitHub Action
that re-evaluates the record every 5 minutes and auto-recovers when the remote
state is terminal.
