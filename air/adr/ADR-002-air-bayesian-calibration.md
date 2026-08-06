---
id: ADR-002
title: "AIR Governance: bayesian-calibration"
status: Rejected
date: "2026-07-16"
generated_by: AIR Pipeline (5_codegen)
---

# Context

The AIR governance engine evaluated capability state against the `bayesian-calibration` constitutional rule module.

## Rule Description

Evaluates Bayesian prior calibration dataset sufficiency. Enforces HF-5: minimum n=200 cases required for production calibration.

## Evaluation Result

- **Conclusion:** FAIL
- **Reason:** Calibration dataset size 0 below minimum threshold 200
- **Affected Capabilities:** bayesian-calibration
- **Evidence References:** 57e8fb89c57d5986, 23f7a2c643c37252, df09e2796f95ba6a, 917f2cbe8deba246

## Inference Summary

- `bayesian-calibration`: FAIL (confidence: 0)

# Decision

The capability matrix fails to satisfy constitutional invariants for this rule. This is a release blocker.

# Consequences

- Release pipeline is BLOCKED at this gate.
- Issue must be resolved before deployment.
- Knowledge Graph updated with BLOCKED decision node.
