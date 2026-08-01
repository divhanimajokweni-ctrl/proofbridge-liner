---
id: ADR-005
title: "AIR Governance: quorum-registry"
status: Rejected
date: "2026-07-16"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the `quorum-registry` constitutional rule module.

## Rule Description

Evaluates quorum evidence sufficiency. Each capability requires evidence from at least 2 distinct collectors for independent verification.

## Evaluation Result

- **Conclusion:** FAIL
- **Reason:** Quorum registry violations: hmac-webhook: only 1 contributor(s) — quorum requires 2+; bayesian-calibration: only 1 contributor(s) — quorum requires 2+
- **Affected Capabilities:** hmac-webhook, bayesian-calibration
- **Evidence References:** ac506d5b36a4abb9, 162ff1ac427e73e3, f6959ca99600c593, b05a393dd8cc327d, 57e8fb89c57d5986, 23f7a2c643c37252, df09e2796f95ba6a, 917f2cbe8deba246

## Inference Summary

- `hmac-webhook`: PASS (confidence: 1)
- `bayesian-calibration`: FAIL (confidence: 0)

# Decision

The capability matrix fails to satisfy constitutional invariants for this rule. This is a release blocker.

# Consequences

- Release pipeline is BLOCKED at this gate.
- Issue must be resolved before deployment.
- Knowledge Graph updated with BLOCKED decision node.
