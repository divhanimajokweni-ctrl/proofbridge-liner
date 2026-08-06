# Operator Runbook — VVU-VAL-001

## Overview

You are the on-call operator for the 72-hour validation run. Your role is tightly constrained to prevent any intervention that could invalidate the validation. Every action you take is logged and signed, and is subject to independent observer review.

## Golden Rules (Non-Negotiable)

| Rule | Rationale |
|------|-----------|
| **No code changes** | The frozen commit hash must remain the build under test for the full 72 hours. |
| **No configuration edits** | Config changes could alter the runtime's behaviour mid-run, invalidating earlier phases. |
| **No manual Fact Log edits** | The Fact Log is append-only and immutable. Any edit is a Critical failure (§3.1). |
| **No manual Circuit Breaker transitions** (except documented recovery) | The CB must transition per the state machine. Manual transitions permitted only for P5/P7 documented recovery sequences. |
| **Hardware replacement only** | If a physical node fails, you may replace it. Log timestamp, node ID, and sign the entry. |
| **All interventions logged** | Every SSH session, kubectl command, hardware touch — logged to an append-only operator log. |
| **All interventions signed** | Every log entry is signed with your Ed25519 key (published before T=0). |
| **No touching evidence bundles** | Evidence bundles are produced by the archiver and are immutable. You have no write access. |

## Your Operator Key

Before T=0, generate an Ed25519 keypair and publish the public key:

```bash
# Generate
openssl genpkey -algorithm Ed25519 -out operator-key.pem
openssl pkey -in operator-key.pem -pubout -out operator-public-key.pem

# Publish the public key (commit to the repo)
cp operator-public-key.pem validation/VVU-VAL-001/protocol/operator-public-key.pem
git add validation/VVU-VAL-001/protocol/operator-public-key.pem
git commit -m "operator: publish public key for VAL-001"
```

## Operator Log Format

Every action is logged to `validation/VVU-VAL-001/evidence/operator.log` (append-only):

```
[2026-XX-XX T+HH:MM:SS] [signed] Operator SSH session opened
  reason: <one-line description>
[2026-XX-XX T+HH:MM:SS] [signed] kubectl command: <command>
  reason: <one-line description>
[2026-XX-XX T+HH:MM:SS] [signed] Hardware replacement: node-3
  reason: NVMe failure; replaced with identical model
  new serial: <serial>
[2026-XX-XX T+HH:MM:SS] [signed] Operator SSH session closed
```

## Phase-by-Phase: What to Watch

| Phase | Hours | What to watch | When to act |
|-------|-------|----------------|-------------|
| P1 Nominal | 0–12 | CB stays NORMAL | Only if CB goes FAIL-CLOSED (Critical) |
| P2 Flood | 12–24 | Queue depth, CB may go DEGRADED | Only if CB goes FAIL-CLOSED (Critical) |
| P3 Network Chaos | 24–36 | Replay status, latency | Only if replay goes DIVERGENT (Critical) |
| P4 Storage Pressure | 36–48 | Disk usage, CB DEGRADED expected | Only if disk fills to 100% (replace PV) |
| P5 Node Failure | 48–60 | Pods restarting, CB recovery | Only if a pod doesn't restart within 5 min |
| P6 Security | 60–66 | Rejected payloads, HF gates | Only if a spoofed payload is ACCEPTED (Critical) |
| P7 Partition | 66–72 | NATS queue, then HLC merge | Only if merge produces conflicts (Critical) |

## Critical Failure Response

If a Critical failure occurs (§3.1):

1. **Do NOT attempt to fix it.** The run terminates immediately; the outcome is FAIL.
2. **Log the failure** in the operator log with timestamp and description.
3. **Notify** the VVU engineering lead and the independent observers.
4. **Preserve all evidence** — do not delete or modify any logs, bundles, or state.
5. **File a postmortem** within 48 hours, published alongside the evidence package.

A Critical failure is itself valuable evidence. The logs, artifacts, and postmortem are published alongside any subsequent successful rerun.

## Operator Log Review

The operator log is:
- Part of the evidence package (published at H72)
- Reviewed by the independent observers (§10)
- Any violation of the Golden Rules is a Critical failure and causes overall FAIL

## Contact

| Role | Contact |
|------|---------|
| Engineering lead | [to be appointed] |
| Independent observers | [published before T=0] |
| On-call operator (you) | [your contact, published before T=0] |
