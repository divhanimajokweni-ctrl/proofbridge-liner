# ProofBridge Beta v1.0 — Release Manifest

## Source snapshot

The uploaded workspace contains the Beta v1.0 release snapshot at local commit `3a7aa9ec0d8dc8ac4e96eb608a99370ac8d04142`:

`feat: VVU STUDI & IVE SEARM STUDIO Beta v1.0 Release`

## Runtime release files

- `src/app/api/attestations/route.ts`
- `src/app/api/subscriptions/route.ts`
- `src/app/api/webhooks/events/route.ts`
- `src/app/api/webhooks/paystack/route.ts`
- `src/app/api/webhooks/stitch/route.ts`
- `src/components/ive/ive-boot-sequence.tsx`
- `src/components/ive/ive-canvas.tsx`
- `src/components/ive/ive-header.tsx`
- `src/components/ive/ive-sidebar.tsx`
- `src/components/studi/ive-workspace-wrapper.tsx`
- `src/components/studi/payment-rails-panel.tsx`
- `src/components/studi/vvu-studio-dashboard.tsx`
- `src/components/vvu/command-palette-v2.tsx`
- `src/lib/ive/cad.ts`
- `src/lib/ive/contract.ts`
- `src/lib/ive/evidence.ts`
- `src/lib/ive/proofGraph.ts`
- `src/lib/ive/types.ts`
- `src/lib/payments/attestation-engine.ts`
- `src/lib/payments/authorization-guard.ts`
- `src/lib/payments/clerk-sync.ts`
- `src/lib/payments/signature-verify.ts`
- `src/lib/studi/governance-data.ts`

## Release documents

- `public/docs/VVU_RELEASE_BETA_v1.0.pdf`
- `public/docs/VVU_Full_Memorandum_with_Appendices.pdf`
- `public/docs/VVU_Shareholders_Agreement.pdf`

## Release scope

- VVU STUDI governance command center
- IVE SEARM Studio engineering verification environment
- Stitch and Paystack payment attestation rails
- Deterministic SHA-256 attestation engine
- Five-point authorization predicate
- Clerk payment-attestation metadata sync
- GOV-001 through GOV-010 invariants
- Mobile command palette

This branch is the release integration branch. The manifest deliberately excludes the uploaded workspace's stale development-only material from the release scope.