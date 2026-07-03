# TRD-1.0 — Trust Root Disclosure

## Purpose

This document discloses what cryptographic signing proves about the Obligation
Registry at each governance stage. It exists to scope VVU's verifiability
claims to what is actually implemented — no more, no less.

## Definitions

| Term | Meaning |
|------|---------|
| **Signing key** | The Ed25519 private key that signs `OBLIGATION-REGISTRY.yaml` |
| **Verification key** | The corresponding Ed25519 public key, published out-of-band |
| **Canonical payload** | JCS-style compact JSON serialization of the registry (deterministic byte order) |
| **Stage** | Governance maturity stage as defined in REPOSITORY-GOVERNANCE.yaml |

## Stage 0 (Current) — Single-Key Custody

- **Signer:** Founder (single natural person)
- **Key custody:** SafeKrypte root key (port 5096, `SAFEKRYPTE_ROOT_KEY`)
- **Verification:** Any participant with the published public key can verify that
  the registry has not been altered since signing
- **Tamper evidence:** Real — an unsigned or differently-signed registry is
  detectable by CI and audit tools
- **Tamper proof:** No — the signer can unilaterally produce a new valid
  signature over different content

**What Stage 0 proves:**

> "The Obligation Registry has not been modified since the Founder last signed
> it. The signature is authentic — it was produced by the SafeKrypte root key."

**What Stage 0 does NOT prove:**

> "The Founder was not coerced, the Founder did not change their mind, or no
> other party exerted influence on the signing decision."

**Implication:** Stage 0 is **tamper-evident, not tamper-proof**. It is
functionally equivalent to a published checksum with a known publisher. This
is acceptable for Stage 0 because the governance process is still
single-operator. It is not acceptable for Stage 1+.

## Stage 1 (Target) — Multi-Party Quorum (2-of-3)

- **Signers:** Three TSC members with individually-provisioned SafeKrypte keys
- **Quorum:** 2-of-3 multisignature (see `quorum-registry.ts`)
- **Verification:** Any participant can verify that at least 2 of 3 known
  signers produced the aggregate signature
- **Tamper evidence:** Real
- **Tamper proof:** Yes — no single party can unilaterally rewrite

**What Stage 1 proves:**

> "At least 2 of 3 independently-held keys signed this registry. Compromise or
> coercion of any single keyholder is insufficient to produce a valid signature."

## Stage 2 (Future) — Threshold Signatures (FROST)

- **Design:** Not yet specified
- **Target property:** m-of-n without revealing which subset signed
- **Conditions:** Requires DKG setup ceremony and audited FROST implementation

## Trust Anchor

The verification key is published in two locations:

1. **`GOVERNANCE/TRUSTED-SIGNER-GB-1.0.pem`** — committed to this repository.
   This is the trust anchor for CI and audit tools. If this file is compromised,
   the trust root is compromised — this is the single point of failure at Stage 0.

2. **SafeKrypte published key directory** — the signing key is the same root
   key that signs ProofBridge receipts (port 5096, `/commons/v1/sign`).
   This is intentional per OB-000023 (Separate Governance Functions): one
   root, scoped by key-derivation, not by a new key.

## Migration Path

```
Stage 0 ──[3 TSC members provisioned]──> Stage 1 ──[FROST audited]──> Stage 2
   single-key             2-of-3 multisig              t-of-n threshold
```

The `GovernanceStage.Stage0Insufficient` guard in `quorum-registry.ts` prevents
anyone from claiming quorum before 2-of-3 keys exist. The code is ready; the
keys are not yet provisioned.

## Disclosure Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-02 | TRD-1.0 — Initial disclosure. Stage 0 single-key, Stage 1 2-of-3 specified | Governance |
