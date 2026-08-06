# AIR Kernel

**License:** Apache 2.0
**Tier:** Open Source — Horizontal Infrastructure

## Purpose

The AIR Kernel is the foundational runtime of the Epistemic DAG system. It provides:

- **Deterministic hashing** (SHA-256, no FNV)
- **RFC 8785 canonicalization** (not `JSON.stringify`)
- **Merkle Mountain Range (MMR)** proofs for evidence inclusion
- **Acceptance pipeline** — the universal entry point for all fact creation
- **Policy evaluation engine** — deterministic IR opcodes
- **Projection engine** — derived views over fact streams
- **Schema registry** — strict validation with `additionalProperties: false`
- **Deterministic sequencer** — monotonic sequence numbers
- **Replay verification** — 12-assertion deterministic kernel check
- **Observation adapters** — vendor-neutral translation layer
- **Runtime providers** — clock, entropy, UUID, signer, storage (all injected)

## Golden Rule

**No product-specific logic lives in the AIR Kernel.**

The kernel is purely horizontal infrastructure. It serves as the shared foundation
for all VVU EARTH TECH products — open-source and commercial alike. Any feature
that is specific to a particular product, industry, or compliance regime belongs
in a higher-level module, not in the kernel.

This ensures:
1. The kernel remains auditable and verifiable by anyone
2. Commercial modules can build on the kernel without forking it
3. The open-source community can trust the kernel is not "crippled" for commercial benefit

## Re-export Structure

This module re-exports everything from `src/lib/kernel/`, providing a clean
public API boundary for external consumers:

```
open-source/air-kernel/index.ts → src/lib/kernel/
```

## Verification

Run the 12-assertion kernel verification to confirm deterministic behavior:

```typescript
const kernel = RuntimeKernel.create(config);
const assertions = await kernel.verifyKernel();
assertions.forEach(a => console.log(`${a.name}: ${a.passed ? 'PASS' : 'FAIL'}`));
```
