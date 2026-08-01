---
id: ADR-004
title: "AIR Governance: normative-transition"
status: Rejected
date: "2026-07-16"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the `normative-transition` constitutional rule module.

## Rule Description

Validates RFC 2119 normative tag transitions. Ensures no binding obligation has been weakened without proper governance transition.

## Evaluation Result

- **Conclusion:** FAIL
- **Reason:** Normative transition violations: governance-anchor: capability is non-compliant (conclusion: FAIL); bayesian-calibration: capability is non-compliant (conclusion: FAIL)
- **Affected Capabilities:** governance-anchor, bayesian-calibration
- **Evidence References:** 446dd65b879e2909, e8e4bb874513dd2e, 5c4fd1ceb80e31dd, 07470382648050ab, 05da58be3929f989, f4f55121cb4a1dd0, ed662d9b7f03e118, 3c4ec8a76a6f3b07, d9d3d14e89a742d5, c60cf94d4006a1d9, 2e27399b0d463501, 2ca0e8cacf9d3d99, 57e8fb89c57d5986, 23f7a2c643c37252, df09e2796f95ba6a, 917f2cbe8deba246

## Inference Summary

- `governance-anchor`: FAIL (confidence: 0.5)
- `bayesian-calibration`: FAIL (confidence: 0)

# Decision

The capability matrix fails to satisfy constitutional invariants for this rule. This is a release blocker.

# Consequences

- Release pipeline is BLOCKED at this gate.
- Issue must be resolved before deployment.
- Knowledge Graph updated with BLOCKED decision node.
