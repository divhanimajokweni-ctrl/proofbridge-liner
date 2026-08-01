---
id: ADR-006
title: "AIR Governance: trust-boundary-integrity"
status: Accepted
date: "2026-07-16"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the `trust-boundary-integrity` constitutional rule module.

## Rule Description

Evaluates TEE attestation capability against the 0.80 confidence threshold. Enforces HF-1: TEE must be real hardware attestation, not a config flag.

## Evaluation Result

- **Conclusion:** PASS
- **Reason:** TEE attestation confidence 0.8 meets threshold 0.8
- **Affected Capabilities:** tee-attestation
- **Evidence References:** 8827759d2d80f890, 14b49fd3aba1bb7d, 4d93f12e780db554, 0ca281b998d1ff72

## Inference Summary

- `tee-attestation`: PASS (confidence: 0.8)

# Decision

The capability matrix satisfies all constitutional invariants for this rule. No release block.

# Consequences

- Release pipeline may proceed past this gate.
- Knowledge Graph updated with CERTIFIES edge.
