# EXECUTIVE GOVERNANCE & SCIENTIFIC RESEARCH PROTOCOL

**Document ID**: VVU-PF-HOM-001_Rev3.2
**Date**: 23 June 2026
**Status**: SCIENTIFICALLY READY FOR UNIVERSITY REVIEW

---

## 6.0 Intellectual Property & Governance Framework

### 6.1 Background IP

Venture Vision Ubuntu (Pty) Ltd (VVU) retains exclusive ownership of all pre-existing technologies, data architectures, and algorithms declared in the Appendix A asset register. UCT is granted a non-exclusive, royalty-free, time-limited licence to access and apply these assets strictly for executing the research milestones defined herein.

### 6.2 Foreground IP & Publications

Any new intellectual property generated during this collaboration shall be addressed under a separate, definitive Research Agreement executed prior to active field deployments. UCT maintains the absolute right to publish academic findings derived from Foreground IP, subject to a standard 30-day pre-submission safety and redaction review window by VVU.

---

## APPENDIX A: BACKGROUND INTELLECTUAL PROPERTY REGISTER

| Asset ID | Asset Description | Category | Protection Status |
| :--- | :--- | :--- | :--- |
| **BG-001** | Hydro-Bayesian Kernel (HBK) Core Sequential Estimation Architecture | Algorithmic | Trade Secret |
| **BG-002** | Observation Vector Schema Topology $O = \{P, F, A, T, H\}$ | Data Schema | Proprietary |
| **BG-003** | Cryptographic Edge Security & Hashing Verification Modules | Security | Trade Secret |
| **BG-007** | Parametric Dual-Mode Competing Likelihood Mixture Model | Mathematical | Trade Secret |

---

## APPENDIX B: EXPERIMENTAL DESIGN & BENCHMARK FRAMEWORK

### 1. The Baseline Ladder

All frameworks are evaluated under strictly controlled, identical resource constraints (sensor density, telemetry payload bandwidth, and computational performance envelopes):

- **B0 (Random Search)**: Uniform probability mapping (Zero information gain floor).
- **B1 (Low-Complexity Operational Baseline)**: Static threshold-based trigger protocols.
- **B2 (EPANET Residual Analysis)**: Batch hydraulic calibration estimation.
- **B3 (Extended Kalman Filter)**: Linearized Bayesian estimation assuming Gaussian-only noise distributions.
- **B4 (Particle Filter)**: Standard non-linear Monte Carlo sequential estimator.
- **B5 (Proposed Dual-Mode Bayesian Framework)**: Adaptive impulsive noise processing model.

### 2. Success Condition

The proposed framework (B5) must demonstrate a statistically significant variance reduction in **Entropy ($\Delta H \geq 3$ bits within $T_{max}$)** and **KL Divergence ($D_{KL}$)** compared to the standard benchmarks (B2 and B3).

---

## APPENDIX C: MONTE CARLO VALIDATION RESULTS

| True State | Posterior Certainty | Cross-Leak Risk |
| :--- | :--- | :--- |
| Node_A | 69.11% | 19.22% (to E, spatial adjacency) |
| Node_B | 93.66% | 5.96% (to C) |
| Node_C | 80.04% | 6.66% (to E) |
| Node_D | 93.54% | 6.28% (to C) |
| Node_E | 64.00% | 20.25% (to A, spatial adjacency) |

**Mathematical Insight**: High-density nodes Node_B and Node_D achieve >93% detection certainty despite deliberate synthetic noise injection.

**Information Floor Verification**: Node_A and Node_E share spatial adjacency constraints, leading to partial entropy sharing (0.1922 cross-leak assignment), providing a perfectly transparent baseline for a student to address via an adaptive transition matrix.

Full simulation output is available in `artifacts/simulation_results.csv`.

---

## Verification

Both code matrices and text structures are validated.
