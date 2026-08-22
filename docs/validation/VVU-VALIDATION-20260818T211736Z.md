# VVU Validation Report — 20260818T211736Z

**Generated:** 2026-08-18T21:18:38.400853+00:00
**Git commit:** `7d66d6efd9cc`
**Git branch:** `main`
**Git main SHA:** `7d66d6efd9cc`
**Repo path:** `/home/z/my-project`

## VVU Validation Gate

```text
VVU VALIDATION GATE

STATUS: RED

Required checks:
[PASS]   BUILD                                  PASS
[FAIL]   TYPECHECK                              FAIL
[PASS]   LINT                                   PASS
[PASS]   UNIT TESTS — webhook                   PASS
[PASS]   UNIT TESTS — security                  PASS
[PASS]   CONTRACT TESTS                         PASS
[PASS]   CONTRACT COMPILE                       PASS
[PASS]   E2E                                    PASS
[PASS]   DEPLOYMENT (workflow YAML)             PASS
[PASS]   LIVE APP — /                           PASS
[PASS]   LIVE APP — /study                      PASS
[PASS]   LIVE APP — /ive                        PASS
[BLOCK]  GPU / ROCm                             BLOCKED
[PASS]   REPOSITORY INTEGRITY — git fsck        PASS
[FAIL]   REPOSITORY INTEGRITY — clean tree      FAIL
[PASS]   PROVENANCE                             PASS
[PASS]   DOCUMENT CONSISTENCY                   PASS
[PASS]   GOVERNANCE — charter amendments        PASS
[PASS]   CONTRACT SYNTAX                        PASS

RELEASE AUTHORIZATION: RED
```

**Tally:** 16 PASS / 2 FAIL / 1 BLOCKED across 19 checks.

---

## Check details

### FAIL — typecheck

- **Status:** `FAIL`
- **Exit code:** `2`
- **Duration:** 5841 ms
- **Command:** `bun x tsc --noEmit`

**stdout (tail):**
```
src/components/ive-workspace/ive-claims-pipeline.tsx(573,25): error TS2322: Type 'EvidenceItem[]' is not assignable to type 'import("/home/z/my-project/src/lib/eis/types").EvidenceItem[]'.
  Type 'EvidenceItem' is not assignable to type 'import("/home/z/my-project/src/lib/eis/types").EvidenceItem'.
    Types of property 'collectedAt' are incompatible.
      Type 'string | Date' is not assignable to type 'Date'.
        Type 'string' is not assignable to type 'Date'.
```

### PASS — lint

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 9866 ms
- **Command:** `bun run lint`

**stdout (tail):**
```
g  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/factories/VVUIVELedger.sol/index.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/factories/VVUIVELedger__factory.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/factories/VVUSovereignRegistry__factory.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/factories/index.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/hardhat.d.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

/home/z/my-project/typechain-types/index.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)

✖ 48 problems (0 errors, 48 warnings)
  0 errors and 42 warnings potentially fixable with the `--fix` option.
```

**stderr (tail):**
```
$ eslint .
```

### PASS — build

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 22586 ms
- **Command:** `bun run build`

**stdout (tail):**
```
ion of types
  Collecting page data using 1 worker ...
  Generating static pages using 1 worker (0/7) ...
  Generating static pages using 1 worker (1/7) 
  Generating static pages using 1 worker (3/7) 
  Generating static pages using 1 worker (5/7) 
✓ Generating static pages using 1 worker (7/7) in 254.9ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api
├ ƒ /api/authorize
├ ƒ /api/claims
├ ƒ /api/claims/[id]
├ ƒ /api/evidence
├ ƒ /api/heat-kernel
├ ƒ /api/n-ind
├ ƒ /api/seed
├ ƒ /api/state
├ ƒ /api/theorem-state
├ ƒ /api/theorem-state/claims/[id]/authorize
├ ƒ /api/theorem-state/claims/[id]/breaker
├ ƒ /api/theorem-state/gates/[slug]
├ ƒ /api/v1/stats/webhooks
├ ƒ /api/v1/webhooks
├ ƒ /api/v1/webhooks/[id]
├ ƒ /api/v1/webhooks/[id]/circuit-breaker/reset
├ ƒ /api/v1/webhooks/[id]/delivery-attempts/[attempt_id]/retry
├ ƒ /api/v1/webhooks/[id]/dlq
├ ƒ /api/verify
└ ○ /study


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**stderr (tail):**
```
$ next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```

### PASS — hardhat_compile

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 794 ms
- **Command:** `bun x hardhat compile`

**stdout (tail):**
```
Nothing to compile
No need to generate any newer typings.
```

### PASS — hardhat_test

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 1636 ms
- **Command:** `bun run hardhat:test`

**stdout (tail):**
```
nce if the student has not anchored telemetry
    ✔ should revoke clearance if the auditor sends a failed telemetry audit
    ✔ should revert if the student already has an active clearance
    ✔ should emit TelemetryAudited on anchor
    ✔ should emit ClearanceMinted on successful issuance
    ✔ should emit ClearanceRevoked on failed audit
    Dormant-deploy activation gate
      ✔ should ship paused = true on deployment
      ✔ should refuse anchor + issue calls while dormant
      ✔ should refuse activate from a non-sovereign caller
      ✔ should refuse activate with a zero commit hash
      ✔ should activate and emit ContractActivated with the commit hash
      ✔ should refuse a second activate (already live)
      ✔ should accept anchor + issue calls after activation
      ✔ should allow sovereign to re-pause via deactivate (emergency rollback)
      ✔ should refuse deactivate from a non-sovereign caller
      ✔ should refuse deactivate while already dormant


  22 passing (786ms)
```

**stderr (tail):**
```
$ TS_NODE_PROJECT='./tsconfig.hardhat.json' TS_NODE_TRANSPILE_ONLY=1 hardhat test
```

### PASS — webhook_tests

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 401 ms
- **Command:** `bun test tests/webhook/`

**stdout (tail):**
```
 AS `kafkaOffset`, `createdAt` AS `createdAt`, `updatedAt` AS `updatedAt`
prisma:query BEGIN IMMEDIATE
prisma:query SELECT `main`.`WebhookCircuitBreakerState`.`id`, `main`.`WebhookCircuitBreakerState`.`webhookId`, `main`.`WebhookCircuitBreakerState`.`state`, `main`.`WebhookCircuitBreakerState`.`terminalFailureCount`, `main`.`WebhookCircuitBreakerState`.`openedAt`, `main`.`WebhookCircuitBreakerState`.`halfOpenProbeAt`, `main`.`WebhookCircuitBreakerState`.`halfOpenProbeResult`, `main`.`WebhookCircuitBreakerState`.`updatedAt` FROM `main`.`WebhookCircuitBreakerState` WHERE (`main`.`WebhookCircuitBreakerState`.`webhookId` = ? AND 1=1) LIMIT ? OFFSET ?
prisma:query COMMIT
prisma:query INSERT INTO `main`.`AuditEvent` (`id`, `type`, `webhookId`, `deliveryId`, `attemptId`, `details`, `createdAt`) VALUES (?,?,?,?,?,?,?) RETURNING `id` AS `id`, `type` AS `type`, `webhookId` AS `webhookId`, `deliveryId` AS `deliveryId`, `attemptId` AS `attemptId`, `details` AS `details`, `createdAt` AS `createdAt`
```

**stderr (tail):**
```
[0.01ms]
(pass) retry: shouldRetry > no retry after success [0.02ms]
(pass) retry: shouldRetry > no retry after non_retryable
(pass) retry: shouldRetry > retry retryable outcomes if attempts remain [0.02ms]
(pass) retry: shouldRetry > retry timeout and connection_failure [0.01ms]
(pass) retry: shouldRetry > no retry past MAX_ATTEMPTS regardless of outcome [0.02ms]
(pass) retry: parseRetryAfter (429 Retry-After header) > seconds format (RFC 7231) [0.09ms]
(pass) retry: parseRetryAfter (429 Retry-After header) > HTTP-date format (RFC 7231) [0.07ms]
(pass) retry: parseRetryAfter (429 Retry-After header) > past date returns 0 (retry immediately) [0.02ms]
(pass) retry: parseRetryAfter (429 Retry-After header) > capped at MAX_DELAY_MS (625s)
(pass) retry: parseRetryAfter (429 Retry-After header) > null/empty returns null [0.02ms]
(pass) retry: parseRetryAfter (429 Retry-After header) > garbage returns null [0.01ms]

 52 pass
 0 fail
 952 expect() calls
Ran 52 tests across 4 files. [392.00ms]
```

### PASS — security_tests

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 271 ms
- **Command:** `bun test tests/security/`

**stdout (tail):**
```
uitBreakerState`.`openedAt`, `main`.`WebhookCircuitBreakerState`.`halfOpenProbeAt`, `main`.`WebhookCircuitBreakerState`.`halfOpenProbeResult`, `main`.`WebhookCircuitBreakerState`.`updatedAt` FROM `main`.`WebhookCircuitBreakerState` WHERE (`main`.`WebhookCircuitBreakerState`.`webhookId` = ? AND 1=1) LIMIT ? OFFSET ?
prisma:query COMMIT
prisma:query INSERT INTO `main`.`AuditEvent` (`id`, `type`, `webhookId`, `deliveryId`, `attemptId`, `details`, `createdAt`) VALUES (?,?,?,?,?,?,?) RETURNING `id` AS `id`, `type` AS `type`, `webhookId` AS `webhookId`, `deliveryId` AS `deliveryId`, `attemptId` AS `attemptId`, `details` AS `details`, `createdAt` AS `createdAt`
prisma:query UPDATE `main`.`Webhook` SET `secret` = ?, `nextSecret` = ?, `updatedAt` = ? WHERE (`main`.`Webhook`.`id` = ? AND 1=1) RETURNING `id` AS `id`, `name` AS `name`, `url` AS `url`, `type` AS `type`, `secret` AS `secret`, `nextSecret` AS `nextSecret`, `enabled` AS `enabled`, `createdAt` AS `createdAt`, `updatedAt` AS `updatedAt`
```

**stderr (tail):**
```
austion > retry budget ratio is locked at 10% [1.78ms]
(pass) Slim Shady §17.3 Delivery Layer: DLQ manipulation (double replay) > marking an entry as replayed twice is a no-op (idempotent) [5.00ms]
(pass) Slim Shady §17.3 Delivery Layer: Webhook sequence attacks > partition key is webhook_id (stable hash) — same webhook → same partition [1.48ms]
(pass) Slim Shady §17.3 Delivery Layer: Idempotency-Key stability (Pillar 5) > publishReplay preserves the existing delivery_id (does NOT mint a new one) [5.71ms]
(pass) Slim Shady §17.3 Delivery Layer: TOCTOU on replay (concurrent) > route returns 409 if DLQ entry already has replayedAt set [5.48ms]
(pass) Slim Shady §17.3 Delivery Layer: No auto-replay on CB close (Pillar 4) > forceReset does NOT replay or modify DLQ entries [5.90ms]
(pass) Slim Shady §17.3 Delivery Layer: Secret rotation dual-signature > when nextSecret is set, both signature headers are sent [24.51ms]

 8 pass
 0 fail
 21 expect() calls
Ran 8 tests across 1 file. [263.00ms]
```

### PASS — git_fsck

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 5600 ms
- **Command:** `git fsck --strict --full`

### FAIL — git_status_clean

- **Status:** `FAIL`
- **Exit code:** `1`
- **Duration:** 193 ms
- **Command:** `git diff --quiet`

### PASS — yaml_workflow_validate

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 87 ms
- **Command:** `python3 -c import yaml,glob,sys; files=glob.glob('.github/workflows/*.yml')+glob.glob('.github/workflows/*.yaml'); [print(f'OK: {f}' if yaml.safe_load(open(f)) else f'FAIL: {f}') for f in files]`

**stdout (tail):**
```
OK: .github/workflows/security-tests.yml
OK: .github/workflows/gpu-pipeline-activation.yml
```

### PASS — live_app_health

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 11 ms
- **Command:** `curl -s -o /dev/null -w %{http_code} --max-time 5 http://localhost:3000/`

**stdout (tail):**
```
200
```

### PASS — live_app_health_landing

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 8 ms
- **Command:** `curl -s -o /dev/null -w %{http_code} --max-time 5 http://localhost:3000/study`

**stdout (tail):**
```
200
```

### PASS — live_app_health_ive

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 10 ms
- **Command:** `curl -s -o /dev/null -w %{http_code} --max-time 5 http://localhost:3000/ive`

**stdout (tail):**
```
404
```

### PASS — provenance_build_id_match

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 13 ms
- **Command:** `bash -c BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null); SERVER_PID=$(pgrep -f 'standalone/server.js' | head -1); HTTP=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000/); echo "build_id=$BUILD_ID server_pid=$SERVER_PID http=$HTTP"; if [ -n "$BUILD_ID" ] && [ -n "$SERVER_PID" ] && [ "$HTTP" = '200' ]; then exit 0; else exit 1; fi`

**stdout (tail):**
```
build_id=axZwsN8meqkBIf051Dvyn server_pid=14380 http=200
```

### BLOCK — gpu_available

- **Status:** `BLOCKED`
- **Exit code:** `1`
- **Duration:** 3 ms
- **Command:** `bash -c if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=name --format=csv,noheader; elif command -v rocminfo >/dev/null 2>&1; then rocminfo | head -30; else echo NO_GPU_TOOLING; exit 1; fi`
- **Blocker:** sandbox limitation: NO_GPU_TOOLING

**stdout (tail):**
```
NO_GPU_TOOLING
```

### PASS — e2e_playwright

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 14585 ms
- **Command:** `bun run test:e2e`

**stdout (tail):**
```
Running 1 test using 1 worker

  ✓  1 [chromium] › tests/e2e/vvu-fail-closed.spec.ts:28:5 › VVU Fail-Closed Valve — All GO → Miles → breaker trip → pulsing-red INCONCLUSIVE (13.0s)

  1 passed (14.0s)
```

**stderr (tail):**
```
$ playwright test --config=playwright.config.ts
(node:18582) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
```

### PASS — contract_solc_syntax

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 3 ms
- **Command:** `bash -c for f in contracts/*.sol; do echo "--- $f ---"; head -5 "$f"; done`

**stdout (tail):**
```
--- contracts/VVUIVELedger.sol ---
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * VVUIVELedger — on-chain anchor for the VVU IVE fail-closed valve.
--- contracts/VVUSovereignRegistry.sol ---
// SPDX-License-Identifier: MIT
// ============================================================================
// VVUSovereignRegistry — Sovereign-grade clearance registry (fail-closed)
// ============================================================================
// Roles:
```

### PASS — doc_consistency_refs_exist

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 1 ms
- **Command:** `bash -c FAIL=0; for md in README.md VVU-ARCHITECTURE.md VVU-GOVERNANCE-CHARTER.md VVU-SESSION-PROTOCOL.md VVU-LAYER-MAP.md PRE-DEPLOY-VERIFICATION.md; do   [ -f "$md" ] || { echo "MISSING: $md"; FAIL=1; }; done; exit $FAIL`

### PASS — governance_charter_amendments_count

- **Status:** `PASS`
- **Exit code:** `0`
- **Duration:** 3 ms
- **Command:** `bash -c N=$(grep -icE '^## (amendment|article) [ivx]+' VVU-GOVERNANCE-CHARTER.md 2>/dev/null); echo "amendments=$N"; if [ "$N" -ge 11 ]; then exit 0; else exit 1; fi`

**stdout (tail):**
```
amendments=11
```

---

## Governing rule

> VVU does not ship on confidence. VVU ships on verified state.

Per the VVU Green-Light Gate, only **GREEN** (every required check PASS) authorizes release. Any FAIL or BLOCKED renders the gate RED.

### State definitions

| State | Meaning |
| --- | --- |
| **PASS** | Test actually executed and passed |
| **FAIL** | Test actually executed and failed |
| **BLOCKED** | Test could not execute; exact blocker recorded |

### Excluded from GREEN consideration

- "Prepared", "configured", "should work", and "ready" are not test results.
- Speculation is forbidden.
- Invented success is forbidden.

*Artifact JSON: `artifacts/vvu-validation-20260818T211736Z.json`*
