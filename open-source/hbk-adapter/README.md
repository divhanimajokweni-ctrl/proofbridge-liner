# HBK Adapter — Hydro-Bayesian Domain Adapter

**License:** Apache 2.0
**Tier:** Open Source — Domain Adapter (Placeholder)

## Purpose

The Hydro-Bayesian Domain Adapter (HBK Adapter) bridges domain-specific models
with the Epistemic Runtime's Bayesian inference engine. It translates
domain-specific signals (e.g., water treatment pH levels, grid frequency
deviations, hospital census data) into the runtime's observation format and
provides domain-aware likelihood functions for Bayesian posterior updates.

### Planned Capabilities

- **Domain signal translation** — convert domain-specific measurements into ER observations
- **Likelihood function adapters** — provide domain-aware Bayesian likelihood functions
- **Threshold calibration** — domain-specific threshold and drift detection
- **Multi-domain composition** — compose evidence from multiple domain adapters

### Example Domains

- **Water treatment** — pH, turbidity, chlorine residual monitoring
- **Grid frequency** — electrical grid stability and frequency deviation detection
- **Hospital census** — patient flow, bed occupancy, and resource utilization
- **Cold chain** — temperature compliance for pharmaceutical logistics
- **Fleet safety** — vehicle telemetry and safety compliance

### Status

**NOT IMPLEMENTED** — This module is a placeholder. The API surface is defined
but no functionality is available yet.

### Relationship to Other Modules

- Depends on: `air-kernel` (for observation submission and MMR proofs)
- Depends on: `epistemic-runtime` (for Bayesian inference engine and trust runtime)
- Complements: `compliance-automation` (commercial tier for auto-evidence generation)
