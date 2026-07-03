# PLAN — PROOFBRIDGE-LINER & CRAFT INFRASTRUCTURE — 2026-07-03

## Business Intent
Deliver a production-grade ProofBridge-Liner interface with zero-overhead native Lean 4 LSP verification, CRAFT cross-modal retrieval, and bento-grid compliance dashboard, alongside a resurrected Ubuntu Pools landing page — enabling cryptographic proof verification and ROSCA settlement monitoring within a single unified architecture.

## User Stories
1. As a **proof engineer**, I need a Monaco-based source editor with ConfidencePip gutter indicators and line-by-line CRAFT mapping so that I can write and verify Lean 4 proofs against compliance controls.
2. As a **compliance officer**, I need a real-time Sprinto evidence log panel showing LSP verification timestamps and cryptographic evidence hashes so that I can prove continuous control validation for SOC 2/ISO 27001 audits.
3. As a **risk manager**, I need a Visual Tactic State Explorer showing proof branches and regulatory mapping overlays so that I can assess third-party risk and audit readiness at a glance.
4. As an **incident responder**, I need an AI Case Management dashboard (SpeakUp-style) with severity triage so that proof anomalies translate directly into compliance tickets.
5. As a **pool member**, I need an upgraded Ubuntu Pools page with the bento-grid design and interactive score/creator tools so that I can preview ROSCA participation in a modern interface.

## Acceptance Criteria
- [ ] `infra/docker-compose.craft.yml` runs 5 services (etcd, minio, milvus, lean-lsp, craft-ingest) on `docker compose up -d`
- [ ] Lean 4 LSP is accessible via TCP on port 8888 (socat bridge)
- [ ] Milvus vector DB accepts gRPC connections on port 19530
- [ ] `app/proofbridge/page.tsx` rebuilt with bento-grid layout containing 4 panels: Monaco editor + ConfidencePip, Lean 4 output/Sprinto log, Tactic State Explorer graph, AI Case Management
- [ ] `app/pools/page.tsx` rebuilt with bento-grid layout preserving Ubuntu Score simulator, Pool creator, Ant Stack, LINDIWE assistant
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] CRAFT ingestion flow documented and Dockerfile created

## Compliance Gate Status
Hard failures in scope : HF-3 (GovernanceAnchor), HF-4 (HMAC domain), HF-1 (TEE attestation)
This plan resolves     : None directly — this is UI/infrastructure, not contract/signing code
This plan does not touch: HF-2 (ZK proofs), HF-5 (calibration dataset)
Branch gate            : `compliance-fabric` ✓

## Affected Files
- `infra/docker-compose.craft.yml` — **NEW** — Full Docker Compose stack for Milvus/etcd/MinIO/Lean LSP/CRAFT ingest
- `infra/Dockerfile.craft-ingest` — **NEW** — CRAFT ingestion worker Docker image (Python + tree-sitter-lean + PyTorch)
- `app/proofbridge/page.tsx` — **REWRITE** — From 432-line monolith to bento-grid 4-panel layout with Midnight theme, Monaco editor, ConfidencePip gutter, Tactic State Explorer, Sprinto log, AI Case Management
- `app/pools/page.tsx` — **REWRITE** — From 573-line monolith to dark bento-grid layout preserving all interactive features (score simulator, pool creator, ant stack, LINDIWE)
- `scripts/craft/ingest.py` — **NEW** — Python ingestion script: tree-sitter-lean parse → embedding → Milvus upsert
- `scripts/craft/setup-milvus.py` — **NEW** — Milvus collection schema creation
- `app/styles/variables.css` — Possibly extend with .craft-grid, .midnight-* utility classes

## Test Assertions
- `docker compose -f infra/docker-compose.craft.yml config` → valid YAML
- `npm run build` → exit code 0 (Next.js build + TypeScript compilation)
- `curl localhost:3000/proofbridge` → 200, returns bento-grid HTML
- `curl localhost:3000/pools` → 200, returns bento-grid HTML
- `python3 scripts/craft/setup-milvus.py --dry-run` → valid output

## Branch
`compliance-fabric`

## Token Budget Estimate
~25-35 turns across all phases (investigation complete, plan + 4 implementation phases + validation)

## Handoff Plan
Write `active/HANDOFF.md` at session end with exact state of each file changed, build status, and next steps for SafeKrypte key provisioning and GovernanceAnchor deployment.

## APPROVED BY: Headless Auto-approval DATE: 2026-07-03
