# Task 4-5: Merge Evidence Envelope and Trust Runtime

## Agent: merge-trust-runtime

## Summary

Merged key components from the cloned proofbridge-liner repo into the Epistemic Runtime project, adding them as complementary layers ON TOP of the existing deterministic kernel.

## Files Created

### Evidence Envelope System (src/lib/evidence/)
- `envelope.ts` — 8-stage execution envelope types and builder with injected providers
- `hashing.ts` — Envelope hashing using kernel canonicalization + SHA-256
- `signer.ts` — KernelEvidenceSigner backed by kernel SignerProvider
- `ledger.ts` — Append-only evidence ledger with InMemoryEvidenceLedger
- `gate-envelope.ts` — EnvelopeEmittingGate wrapping policy/execution gates
- `airEngine.ts` — AIR engine with TEE/ZK/Bayesian stages using kernel providers
- `index.ts` — Barrel export

### Trust Runtime CQRS (src/lib/trust-runtime/)
- `types.ts` — RuntimeEvent schema, KernelState machine, Command types, Projections (with Zod)
- `event-store.ts` — InMemoryEventStore + PostgresEventStore stub
- `reducer.ts` — Pure reducer function (state, event) → nextState
- `projection-manager.ts` — Colony, UI, Metrics, Notification projections
- `command-handler.ts` — DefaultCommandHandler with injected clock/entropy/uuid
- `sse-transport.ts` — Server-side SSE transport (ReadableStream)
- `use-sse-transport.ts` — Client-side EventSource hook for Next.js
- `runtime.ts` — TrustRuntime orchestrator with provider injection
- `index.ts` — Barrel export

### Trust-Crypto Receipts (src/lib/crypto/)
- `hash.ts` — SHA-256, HMAC-SHA256, hash chains, domain hashing using kernel + @noble/hashes
- `merkle.ts` — Merkle tree with proofs, batch verification
- `receipts.ts` — Receipt generation, verification, batch processing with injected providers
- `index.ts` — Barrel export

### Governance ADRs (docs/governance/adrs/)
- `ADR-001-event-sourcing.md`
- `ADR-002-ed25519-signatures.md`
- `ADR-003-canonical-json.md`

## Key Adaptations
- All Date.now() → injected ClockProvider
- All Math.random() → injected EntropyProvider
- All crypto.randomUUID() → injected UuidProvider
- All node:crypto → kernel SHA-256 (@noble/hashes) + kernel SignerProvider
- PostgresEventStore → stub (no Postgres configured)
- SSE client hook → separate file for Next.js client-side use
- Existing kernel completely untouched
