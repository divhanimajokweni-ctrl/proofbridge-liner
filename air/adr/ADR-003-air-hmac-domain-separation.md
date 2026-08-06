---
id: ADR-003
title: "AIR Governance: hmac-domain-separation"
status: Accepted
date: "2026-07-16"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the `hmac-domain-separation` constitutional rule module.

## Rule Description

Evaluates HMAC key domain separation for webhook and VCT namespaces. Enforces HF-4: domain-separated HMAC keys required.

## Evaluation Result

- **Conclusion:** PASS
- **Reason:** HMAC domain separation verified — webhook and VCT keys use distinct namespaces
- **Affected Capabilities:** hmac-webhook
- **Evidence References:** ac506d5b36a4abb9, 162ff1ac427e73e3, f6959ca99600c593, b05a393dd8cc327d

## Inference Summary

- `hmac-webhook`: PASS (confidence: 1)

# Decision

The capability matrix satisfies all constitutional invariants for this rule. No release block.

# Consequences

- Release pipeline may proceed past this gate.
- Knowledge Graph updated with CERTIFIES edge.
