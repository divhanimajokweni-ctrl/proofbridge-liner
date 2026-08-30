# Fail-Closed Infrastructure — Incident Response Playbook

This playbook covers how to detect, diagnose, and recover from failures in the VVU Trust Runtime's fail-closed infrastructure. A fail-closed system is one that defaults to blocking everything when something goes wrong — rather than allowing traffic through and hoping for the best. In VVU, every layer is designed so that an unknown state is treated as a dangerous state. This document tells you what to do when that design triggers.

---

## 1. Overview

### 1.1 What Fail-Closed Means

A fail-closed system halts all operations when it cannot verify that operations are safe. This is the opposite of a fail-open system, which allows operations to continue during uncertainty. VVU is fail-closed because the cost of allowing a fraudulent transaction through is always higher than the cost of halting legitimate traffic temporarily.

### 1.2 Why It Matters

In financial infrastructure, a fail-open system means a compromised or uncertain transaction gets processed. In VVU's model:

- The CircuitBreaker smart contract on Polygon Amoy trips and returns HTTP 423 (Locked) for all verification requests
- The Trust Runtime refuses to score evidence it cannot validate
- Tenant isolation throws `ISOLATION_VIOLATION` rather than allowing cross-tenant access
- SafeKrypte refuses to sign when its key binding mode cannot be verified

Every one of these responses is intentional. They are not bugs. This playbook explains what each one means and how to resolve the underlying cause.

---

## 2. Circuit Breaker Diagnostics

The CircuitBreaker is a smart contract deployed on Polygon Amoy (chain ID 80002) at `0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A`. It enforces trust verdicts on-chain in real time.

### 2.1 DEGRADED Mode

**Symptoms:**

- Dashboard shows amber status indicators
- API responses are slower than normal (>200ms P95)
- Some verification requests succeed while others time out
- The watchdog logs show intermittent heartbeat misses

**Response:**

1. Check the watchdog dashboard for the affected components.
2. Verify network connectivity to the Polygon Amoy RPC endpoint:

```bash
curl -s https://rpc-amoy.polygon.technology | head -c 200
```

3. Check if the ai-model-router is rate-limiting requests. Review logs for HTTP 429 (Too Many Requests) responses.
4. Check if baileys (WhatsApp bridge) is experiencing connection dropouts. Look for `connection_closed` or `reconnecting` entries in the logs.
5. If the degradation is transient (Category A), allow automatic retries to resolve it. Monitor for 10 minutes before escalating.
6. If degradation persists beyond 10 minutes, escalate to Category B (adversarial) investigation.

### 2.2 FAIL-CLOSED Mode

**Symptoms:**

- Dashboard shows red status indicators across multiple components
- All verification requests return HTTP 423 (Locked)
- The CircuitBreaker's `circuitOpen()` returns `true`
- The Prover Pipeline outputs `TRIP` for all incoming evidence
- Money transfers are completely halted

**Response:**

1. **Do not attempt to force transactions through.** The circuit is tripped for a reason.
2. Verify the CircuitBreaker state on-chain:

```bash
air verify --contract 0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A --network polygon-amoy
```

3. Check the audit trail for the most recent TRIP verdict. Identify the evidence that triggered the trip.
4. Review the Prover Pipeline logs to determine which scenario caused the trip:
   - **Scenario A (Transient):** A temporary network or data issue. After resolving the root cause, the circuit can be manually reset.
   - **Scenario B (Adversarial):** An active attack or fraud attempt. Do NOT reset the circuit until the attack vector is identified and mitigated.
   - **Scenario C (Infrastructure):** A system failure. Page an engineer, diagnose the root cause, and reset only after the infrastructure is healthy.
5. Follow the Recovery Protocol (Section 2.3).

### 2.3 Recovery Protocol

**Step 1: Identify the root cause.**

Review the event log in the dashboard. Locate the most recent TRIP event and its associated evidence bundle. The event classification (A/B/C) tells you the nature of the failure.

**Step 2: Resolve the underlying issue.**

- Category A (Transient): Restart the affected service, wait for network conditions to stabilise, or clear the transient data.
- Category B (Adversarial): Isolate the affected component, preserve evidence for forensic analysis, and rotate any potentially compromised credentials.
- Category C (Infrastructure): Repair or replace the failed infrastructure component.

**Step 3: Reset the circuit.**

Only after the root cause is resolved:

```bash
air deploy --config air.config.json --force
```

This is a sensitive operation. The `--force` flag bypasses pre-deployment checks. Use it only during incident recovery with documented approval.

**Step 4: Verify recovery.**

Run a full gate evaluation to confirm all systems are healthy:

```bash
air gate --input evidence.json --strict
```

All six gates (A through F) must pass before the system is considered recovered.

**Step 5: Document the incident.**

Complete the Post-Incident Review template (Section 8).

---

## 3. Poison Payload Recovery

### 3.1 When evaluateTrustGate() Intercepts Corrupted Proofs

The `evaluateTrustGate()` function is the Prover Pipeline's core decision point. It intercepts corrupted proofs or invalid verification keys and returns a TRIP verdict. Symptoms include:

- TRIP verdict with Scenario B (Adversarial) classification
- Evidence validator returns "malformed payload" or "invalid signature"
- Trust score drops below the risk threshold (γ)

### 3.2 Isolation Sequence

1. **Stop the pipeline.** Do not process any further evidence until the poison payload is isolated.
2. **Quarantine the evidence.** Move the corrupted evidence bundle to a quarantine directory:

```bash
mkdir -p air/quarantine
mv air/graph/corrupted-evidence.json air/quarantine/
```

3. **Identify the source.** Determine which upstream system produced the corrupted payload. Check the evidence store's append-only log for the originating transaction.
4. **Assess scope.** Determine if other evidence bundles share the same corruption pattern. Search for similar hash anomalies or invalid verification keys.

### 3.3 Audit Log Verification

Verify the integrity of the audit trail to ensure the poison payload did not corrupt downstream records:

1. Query the audit trail for entries around the time of the corrupted payload.
2. Verify each entry's cryptographic signature against the stored public key.
3. Confirm that no valid entries were overwritten or modified.

### 3.4 Recovery Steps

1. Remove the corrupted evidence from the quarantine directory.
2. Regenerate any affected attestations using valid keys.
3. Re-run the pipeline on the corrected evidence:

```bash
air gate --input corrected-evidence.json
```

4. Verify the output shows SAFE for all corrected entries.
5. Resume normal operations and monitor for recurrence.

---

## 4. TEE Attestation Failure

### 4.1 Symptoms

- Gate F (TEE Attestation) returns a failure in the dashboard
- `verifyAttestation()` returns `false` for a valid attestation
- The attestation timestamp is outside the freshness window

### 4.2 Response

1. Check the SafeKrypte service status:

```bash
curl http://127.0.0.1:5096/health
```

2. Verify the key binding mode. If the system is in `tee` mode, confirm the TEE enclave private key PEM is available and valid.
3. If the system is in software-simulated mode (Phase 1 production), check that the SHA-256 measurement and RSA key fingerprint are being generated correctly.
4. If attestation freshness has expired, regenerate the attestation with a current timestamp.
5. For hardware TEE failures (Phase 5+), consult the hardware vendor's attestation documentation and consider switching to software-simulated mode as a fallback.

---

## 5. DNS Propagation Issues

### 5.1 Symptoms

- The domain `venturevisionubuntu.co.za` does not resolve from certain locations
- Users report intermittent access to the dashboard
- SSL certificate warnings appear in browsers

### 5.2 Diagnosis

Test DNS resolution from multiple points:

```bash
dig venturevisionubuntu.co.za +short
dig venturevisionubuntu.co.za @8.8.8.8 +short
dig venturevisionubuntu.co.za @1.1.1.1 +short
```

If results differ across DNS servers, propagation is incomplete. DNS changes can take up to 48 hours to propagate globally, though most updates appear within 15 minutes.

### 5.3 Resolution

1. Confirm the DNS records are correctly configured in the Host Africa BIND zone file.
2. Verify that the Vercel deployment domain matches the DNS configuration.
3. Check for conflicting records (e.g., old A records or CNAME entries pointing to stale targets).
4. If the issue is with a specific DNS provider's cache, there is no fix other than waiting for TTL expiry.
5. Monitor propagation using a tool like `dnschecker.org`.

---

## 6. Vercel Deployment Failures

### 6.1 Build Failures

**Symptoms:**

- `vercel deploy --prod` exits with a non-zero code
- The Vercel dashboard shows a failed deployment
- Build logs show TypeScript errors, missing modules, or compilation failures

**Response:**

1. Run the build locally to reproduce:

```bash
npm run build
```

2. Fix any TypeScript errors:

```bash
npx tsc --noEmit
```

3. Fix any lint errors:

```bash
npm run lint
```

4. Run the full test suite:

```bash
npm test
```

5. After all local checks pass, retry the deployment:

```bash
vercel deploy --prod --force
```

### 6.2 Deployment Rollbacks

If a deployment introduces a regression:

1. Identify the last known-good deployment ID from the Vercel dashboard.
2. Roll back using the Vercel CLI:

```bash
vercel rollback <deployment-id> --token=$VERCEL_TOKEN
```

3. Verify the rollback:

```bash
curl -s https://proofbridge-liner-1.vercel.app/api/health
```

The health endpoint should return HTTP 200 with `"status":"healthy"`.

4. Document the regression and its cause before attempting a new deployment.

---

## 7. Escalation Matrix

| Severity | Description | Response Time | Who to Contact |
|----------|-------------|---------------|----------------|
| **SEV-1 (Critical)** | Circuit breaker tripped, all money movement halted, data breach suspected | Immediate | Founder + all on-call engineers |
| **SEV-2 (High)** | Single gate failing, service degraded but not halted | Within 1 hour | On-call engineer + compliance lead |
| **SEV-3 (Medium)** | Non-critical service disruption, intermittent failures | Within 4 hours | On-call engineer |
| **SEV-4 (Low)** | Cosmetic issues, non-blocking warnings, documentation gaps | Within 24 hours | Engineering team |

### Contact Information

| Role | Contact |
|------|---------|
| **Founder / Chief Systems Engineer** | +27 62 035 0659 |
| **On-Call Engineer** | Via Slack #incident-response channel |
| **Compliance Lead** | Via Slack #compliance channel |
| **Vercel Support** | support@vercel.com |
| **Polygon Network Status** | status.polygon.technology |

---

## 8. Post-Incident Review

Complete this template after every SEV-1 or SEV-2 incident.

### Incident Report Template

```
INCIDENT REPORT

Date:           [YYYY-MM-DD]
Severity:       [SEV-1 / SEV-2 / SEV-3]
Duration:       [HH:MM duration of impact]
Reported By:    [Name]

SUMMARY:
[One-paragraph description of what happened]

TIMELINE:
[HH:MM] — [Event description]
[HH:MM] — [Event description]
...

ROOT CAUSE:
[Technical description of what caused the incident]

IMPACT:
- Users affected: [number or description]
- Data affected: [description]
- Financial impact: [amount or "none"]
- Compliance impact: [FIC/FSCA/POPIA implications]

RESOLUTION:
[Steps taken to resolve the incident]

PREVENTION:
[What changes will prevent this from recurring]

ACTION ITEMS:
- [ ] [Action item 1] — Owner: [Name] — Due: [Date]
- [ ] [Action item 2] — Owner: [Name] — Due: [Date]

SIGN-OFF:
Reviewed By:    [Name]
Date:           [YYYY-MM-DD]
```

---

## Appendix

### A. Contact Information

| Resource | Details |
|----------|---------|
| VVU Trust Runtime Production URL | `https://proofbridge-liner-1.vercel.app` |
| Polygon Amoy RPC | `https://rpc-amoy.polygon.technology` |
| CircuitBreaker Contract | `0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A` |
| GovernanceAnchor Contract | Configured via `GOVERNANCE_ANCHOR_ADDRESS` env var |
| SafeKrypte Service | `http://127.0.0.1:5096` |
| Health Endpoint | `/api/health` (returns HTTP 200 when healthy) |
| GitHub Repository | `github.com/divhanimajokweni-ctrl/proofbridge-liner` |

### B. Severity Definitions

| Level | Name | Definition |
|-------|------|------------|
| SEV-1 | Critical | Complete system failure, data breach, or financial loss. All money movement halted. Regulatory reporting may be required. |
| SEV-2 | High | Partial system failure affecting one or more gates. Service degraded but not fully halted. No data breach. |
| SEV-3 | Medium | Intermittent failures in non-critical components. Service remains functional with reduced performance. |
| SEV-4 | Low | Cosmetic issues, documentation gaps, or non-blocking warnings. No impact on service functionality. |
