# PLAN — Security Baseline + ProofBridge Verification Scripts — 2026-07-10

> **STATUS: PENDING_APPROVAL** (awaiting Mino sign-off per AGENTS.md Role 2B)
> Tier-3 change. No script code lands on `compliance-fabric` until this is
> marked `APPROVED BY: Mino`. The `.github/workflows/security-baseline.yml`
> (Phase 1, additive CI, non-destructive) is included in the same PR for review.
>
> **Zero-fabrication mandate:** every field, hash formula, transition, and
> signature check below is transcribed from the actual source — not assumed.
> Corroborated independently by KiloCode (read `types.ts`, `command-handler.ts`,
> `event-store.ts`, `runtime.ts`).

## Business Intent
Establish a repeatable security baseline (SAST, secrets, dependency, IaC, SBOM)
and a set of ProofBridge-specific verification scripts that check the runtime's
cryptographic guarantees (hash chain, envelope signatures, snapshot integrity,
deterministic replay) **against the real implementation**. The scripts KiloCode
drafted earlier were scaffolds bound to assumed schemas that do not match this
codebase; this plan re-binds them to ground truth so they cannot produce false
positives or false assurances.

## User Story
As a **VVU compliance operator preparing ProofBridge-Liner for the Polygon Amoy
mainnet gate (2026-07-30)**, I need automated security scanning on every PR and
verification scripts that reproduce the runtime's hashing/signature/replay logic
exactly, so that integrity regressions are caught in CI before they reach
`compliance-fabric`.

## Ground Truth — Extracted Primitives (source of every binding below)

### Event model — `src/lib/trust-runtime/types.ts`
`RuntimeEvent` fields (camelCase): `eventId, type, version, timestamp, sequence,
correlationId, causationId, source, payload, tenantId, streamId, streamVersion,
schemaVersion, payloadHash, eventHash, previousHash`.

### Hash chain — `lib/db/src/repositories/event-store.repository.ts` (durable, authoritative)
```
payloadHash = sha256( JSON.stringify(payload) )                       // NOTE: plain JSON.stringify, NOT key-sorted
eventHash   = sha256( `${prevHash ?? 'GENESIS'}:${eventId}:${payloadHash}` )  // genesis sentinel = literal 'GENESIS'
previousHash = prevHash                                                // null for first event in stream
```
Tables: `trustEvents`, `trustSnapshots`, `trustEventOutbox` (schema `lib/db/src/schema/trust-runtime`).

> **Finding F1 (must inform script design):** `command-handler.ts` constructs
> in-memory events with `payloadHash: "", eventHash: "", previousHash: null`.
> The populated chain exists **only** in the Postgres repository path
> (`DATABASE_URL` set). A hash-chain script run against the in-memory store
> would see empty hashes → it must target the durable `trustEvents` table.

> **Finding F2 (integrity risk, worth a follow-up):** `payloadHash` in the DB
> repo uses `JSON.stringify(payload)` (insertion-order dependent), whereas
> `envelope.ts` and `prover/chain.ts` use a key-sorted `canonicalize()`. If two
> producers serialize the same payload with different key order, hashes diverge.
> The verification script must replicate the DB's exact `JSON.stringify` form,
> and F2 should be tracked as a determinism hardening item (out of scope here).

### Snapshot — same repository
```
snapshotHash = sha256( JSON.stringify(state) )   // verified on load; mismatch throws SnapshotCorruptionError
```
There is **no** `state_root`, `snapshot_id`, or `as_of_hash` field.

### Envelope — `src/lib/crypto/envelope.ts` (`EnvelopeEncryptionEngine`)
AES-256-GCM payload + RSA-OAEP wrapped DEK + **Ed25519 signature over the
canonical HEADER** (the header embeds `payloadHash`). Verify with
`verify(null, canonicalize(header), signerPublicKey, hexDecode(signature))`
(exposed as `verifyIntegrity()`). Envelope shape: `{ header{eventId, streamId,
tenantId, sequence, eventType, schemaVersion, payloadHash}, ciphertext, iv, tag,
encryptedDek, signature (hex), signerPublicKey }`.

### State machine — `types.ts` `ALLOWED_TRANSITIONS`
`IDLE→[INGESTING]`, `INGESTING→[ATTESTING,HAZARD]`, `ATTESTING→[VERIFYING,HAZARD]`,
`VERIFYING→[COMMITTING,HAZARD]`, `COMMITTING→[SETTLED,HAZARD]`, `SETTLED→[IDLE]`,
`HAZARD→[IDLE]`. Event types: `EvidenceReceived, AttestationVerified,
BayesianUpdated, ReceiptCommitted, LedgerConfirmed, CircuitBreakerOpened/Closed,
…` (NOT `ingest_started` etc.).

### Endpoints (filesystem-verified)
Exist: `/api/replay` (Bayesian **receipt** replay via Supabase `receipts` +
`prover/scorer.computePosteriorMean` + `prover/chain.canonicalize`), `/api/verify`,
`/api/health`. Do **not** exist: `/api/events`, `/api/kernel/status`, `/api/snapshot`.

## Acceptance Criteria

### AC1: Security baseline workflow (Phase 1 — in this PR)
- [x] `.github/workflows/security-baseline.yml` added.
- [x] Blocking gates: Semgrep (ERROR severity), Gitleaks (any finding), `npm audit --omit=dev --audit-level=high`.
- [x] Report-only (SARIF to Security tab, non-blocking pending triage): Slither, Trivy fs/misconfig, Syft SBOM.
- [ ] Runs green on a PR to `compliance-fabric` (verify after merge-eligibility).
- [ ] Follow-up tracked: promote Slither/Trivy to blocking after baseline triage.

### AC2: `scripts/verify-hash-chain.ts` (bound to F1/F2)
- [ ] Reads events from the durable `trustEvents` table (requires `DATABASE_URL`); exits with a clear SKIP (documented) if unset — never a false PASS against the empty in-memory chain.
- [ ] Recomputes `payloadHash = sha256(JSON.stringify(payload))` and `eventHash = sha256(`${prev ?? 'GENESIS'}:${eventId}:${payloadHash}`)` per stream, verifying `previousHash` linkage and `streamVersion` contiguity.
- [ ] Exits non-zero on any mismatch, naming the `(streamId, streamVersion, eventId)`.

### AC3: `scripts/verify-envelope-signatures.ts`
- [ ] Imports `canonicalize` + Ed25519 verify semantics from `src/lib/crypto/envelope.ts` (reuse `EnvelopeEncryptionEngine.verifyIntegrity`, do not reimplement).
- [ ] Verifies the signature is over the canonical **header** (incl. `payloadHash`), signature hex-decoded, key = `signerPublicKey` (or a trusted registry key).
- [ ] Exits non-zero on any invalid signature.

### AC4: `scripts/verify-snapshot-integrity.ts`
- [ ] For each row in `trustSnapshots`, recompute `sha256(JSON.stringify(state))` and compare to stored `snapshotHash` (mirrors the repo's load-time check that throws `SnapshotCorruptionError`).
- [ ] Cross-check snapshot `streamVersion` exists in `trustEvents`.
- [ ] Exits non-zero on corruption.

### AC5: `scripts/replay-verify.ts`
- [ ] Reproduces `/api/replay` logic against the Supabase `receipts` table: recompute `computePosteriorMean(mismatches,total,alpha,beta)` and `sha256(canonicalize({...payload, recomputed}))`, compare to `receipt_hash`.
- [ ] Reuses `prover/scorer` + `prover/chain` (no divergent reimplementation).
- [ ] Exits non-zero on any receipt whose recomputed hash ≠ stored hash.

### AC6: CI wiring + notifications
- [ ] A `verification` job (in `security-baseline.yml` or a sibling workflow) runs AC2–AC5 where inputs are available; SKIP-with-reason when `DATABASE_URL`/receipts absent (never silent pass).
- [ ] Lindiwe/WhatsApp summary integration deferred until the notify mechanism is confirmed (open question Q3) — **not** fabricated.

### AC7: Validation
- [ ] `npm run typecheck`, `npm run lint`, `npm test` pass.
- [ ] `active/VALIDATION.md` = PASS before PR promotion (AGENTS.md Role 4).

## Compliance Gate Status
- **Tier:** 3 (ProofBridge crypto verification + CI/compliance infra).
- **Hard Failures touched:** none resolved here; this is detection/CI tooling. Does not alter HF-1..HF-5 status.
- **Branch:** `compliance-fabric` (via feature branch `devin/*-security-baseline` → PR).

## Affected Files
### New
```
.github/workflows/security-baseline.yml     # Phase 1 (this PR)
active/PLAN-security-verification.md         # this plan
scripts/verify-hash-chain.ts                 # AC2 (after approval)
scripts/verify-envelope-signatures.ts        # AC3 (after approval)
scripts/verify-snapshot-integrity.ts         # AC4 (after approval)
scripts/replay-verify.ts                     # AC5 (after approval)
```
### Modified (after approval)
```
.github/workflows/security-baseline.yml      # add verification job (AC6)
package.json                                  # scripts entries if needed
```

## Implementation Order
1. **This PR:** `security-baseline.yml` + this PLAN (PENDING_APPROVAL). No script code yet.
2. **On Mino approval:** AC2 → AC3 → AC4 → AC5 (each reusing real primitives), then AC6 CI wiring, then AC7 validation.

## Open Questions (blockers to specific ACs — do not guess)
- **Q1:** Is `DATABASE_URL` available in CI for AC2/AC4, or should those run against a seeded fixture DB? (Determines SKIP vs run.)
- **Q2:** Is there a trusted Ed25519 public-key registry for AC3, or is `signerPublicKey` self-describing per envelope acceptable for v1?
- **Q3:** Exact Lindiwe/WhatsApp send mechanism for AC6 summaries (local API? script? channel?).

## Risk Mitigations
| Risk | Mitigation |
|------|-----------|
| Script gives false PASS on empty in-memory hashes (F1) | AC2 targets durable `trustEvents`; SKIP-with-reason if `DATABASE_URL` unset |
| Hash divergence from key order (F2) | AC2 replicates the DB's exact `JSON.stringify`; F2 logged as separate hardening item |
| Slither/Trivy noise wedging the repo | Report-only (SARIF), not blocking, until triaged |
| Reimplementing crypto incorrectly | Reuse `envelope.ts`, `prover/scorer`, `prover/chain` — no reimplementation |
| Semgrep/Gitleaks false positives blocking merges | Scoped rulesets + ERROR-only for Semgrep; baseline/allowlist tuning tracked |

## Rollback Plan
- Workflow: delete `.github/workflows/security-baseline.yml` (additive; no runtime impact).
- Scripts: standalone under `scripts/`; removing them does not affect the app or build.
