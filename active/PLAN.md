# PLAN — VVU OS POST-JULY-15 SPRINT 1 — 2026-07-01

## Business Intent
Ship SafeKrypte Lite, SafeLiner Lite, and War Room CLI as production-ready Phase 1 services by 2026-07-31, enabling free-tier ED25519 signing and credential issuance for the first 1000 African creators.

## User Story
As a VVU OS operator, I need all Phase 1 services (SafeKrypte Lite, SafeLiner Lite, War Room CLI, Lindiwe Agent Kernel) to be deployed, monitored, and documented so that the platform is ready for SafeGames Commons Phase 1 launch by 2026-09-30.

## Acceptance Criteria
- [ ] SafeKrypte Lite serves POST /commons/v1/sign on port 5096 with ED25519 signing, returns lite_tier: true
- [ ] SafeKrypte Lite public key accessible at /.well-known/safekrypte-lite-pubkey.pem on both localhost and production Vercel domain
- [ ] SafeLiner Lite issues credentials via POST /commons/v1/issue, verifiable via GET /commons/v1/credential/:id
- [ ] SafeLiner Lite calls SafeKrypte Lite for signature attestation on credential issuance
- [ ] War Room CLI (vvu deploy) starts all 4 services (SafeKrypte Lite :5096, SafeLiner Lite :5097, Operatus :4096, OpenClaw :18789)
- [ ] OpenClaw gateway runs on :18789 with health check returning {"ok":true,"status":"live"}
- [ ] DEPLOY_LOG.md and active/PLAN.md committed to compliance-fabric branch
- [ ] All 9 roadmap deliverables tracked with status in a deliverable registry file

## Compliance Gate Status
- Hard failures in scope: HF-5 (ED25519 key rotation)
- This plan resolves HF-5 by implementing key rotation support in SafeKrypte Lite
- This plan does not touch: HF-1, HF-2, HF-3, HF-4

## Affected Files
- **server/safekrypte-lite.ts** : Add Ubuntu Data Bus event emission stub, add key rotation support (generate new key every N requests for testing, env-var rotation interval for prod), add GET /pk endpoint alias
- **server/safeline-lite.ts** : Wire SafeLiner Lite to call SafeKrypte Lite for signing attestations on credential issue
- **scripts/vvu-cli.sh** : Add doctor check for key rotation, add logs command for tailing service logs
- **openclaw.json** : Verify + update Google Chat plugin config, fix any stale paths
- **active/PLAN.md** : This file — SDD plan
- **active/INVESTIGATION.md** : Current state facts

## Test Assertions
- POST /commons/v1/sign with {"content_hash":"abc","creator_id":"test1"} → 200 { signed_attestation, lite_tier: true, vvu_key_id }
- GET /.well-known/safekrypte-lite-pubkey.pem → 200 with PEM body starting with "-----BEGIN PUBLIC KEY-----"
- POST /commons/v1/issue → credential with signature field matching SafeKrypte Lite format
- bash scripts/vvu-cli.sh doctor → exit 0 with all services green
- curl http://127.0.0.1:18789/health → {"ok":true,"status":"live"}

## Branch
- **compliance-fabric** (Tier-3 compliance work) — merge main changes in first

## Token Budget Estimate
- 15-20 turns for SafeKrypte Lite updates + SafeLiner Lite wiring + War Room CLI updates + OpenClaw start + branch management

## Handoff Plan
- Write session summary to active/HANDOFF.md with current branch state, files changed, and next actions

## APPROVED BY: Mino (via user approval) DATE: 2026-07-01
