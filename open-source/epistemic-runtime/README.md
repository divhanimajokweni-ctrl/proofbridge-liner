# Epistemic Runtime

**License:** Apache 2.0
**Tier:** Open Source — Core Runtime

## Purpose

The Epistemic Runtime provides the full set of runtime primitives for building
trust-based, evidence-grounded systems. It is the composition layer above the
AIR Kernel, adding trust scoring, Bayesian inference, and evidence envelope
processing.

### Components Re-exported

| Source | Purpose |
|--------|---------|
| `src/lib/kernel/` | Core kernel primitives (AIR Kernel) |
| `src/lib/trust-runtime/` | Bayesian confidence scoring, verification gates, SSE transport |
| `src/lib/evidence/` | Evidence envelope pipeline, AIR envelope engine, policy/execution gates |

### Key Primitives

- **Fact** — what happened. Immutable, append-only, deterministically hashed.
- **Proof** — why we believe it. Cryptographic evidence (MMR inclusion proofs).
- **Policy** — whether to accept it. Deterministic IR opcode evaluation.
- **Projection** — how to consume it. Derived views over fact streams.
- **Trust Runtime** — confidence scoring via Bayesian inference, verification gates.
- **Evidence Envelope** — the container for facts + proofs + provenance metadata.

### Architecture Principles

1. **Deterministic by default** — no `Date.now()`, `Math.random()`, or `randomUUID()` in kernel code
2. **Provider injection** — all runtime dependencies (clock, entropy, UUID, signer, storage) are injected
3. **WORM guarantee** — evidence is Write Once, Read Many — no deletion, no mutation
4. **Confidence is derived, not observed** — trust scores are Projections, never Facts
5. **Canonical first** — RFC 8785 JCS for all serialization, not `JSON.stringify`

## Usage

```typescript
import { RuntimeKernel } from 'epistemic-runtime';

const kernel = RuntimeKernel.create(config);
const result = await kernel.submit('observation', { temperature: 42.3 }, 'sensor-001', 'schema-001');
```
