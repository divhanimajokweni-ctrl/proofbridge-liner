# EIS-BOUNDS ZK Circuit

Zero-Knowledge circuit for the Evidence Independence Specification bounds, part of the VVU·SEARM Trust Operating System (VRES v1.2).

## Overview

This circuit proves, without revealing the eigenvalue spectrum, that:

1. **Poseidon Commitment**: `graphCommit = Poseidon(λ₁, λ₂, ..., λₙ)` — ZK commitment to the spectral structure
2. **Spectral Diversification Index**: `N_ind = (Σλᵢ)² / Σ(λᵢ²)` — computed in-circuit with constraint `N_ind > 0`
3. **Algebraic Connectivity**: `λ₂` — Fiedler value (second-smallest eigenvalue) with constraint `λ₂ ≥ 0`
4. **Participation Ratio**: `N_ind / n` — bounded in (0, 1]

## Signals

### Private Inputs (Witness)
| Signal | Type | Description |
|--------|------|-------------|
| `lambda[0..7]` | Private | Eigenvalue spectrum (fixed-point ×10⁶) |

### Public Outputs
| Signal | Type | Description |
|--------|------|-------------|
| `graphCommit` | Public | Poseidon hash of eigenvalue spectrum |
| `nInd` | Public | Spectral Diversification Index (fixed-point ×10⁶) |
| `lambda2` | Public | Fiedler value / algebraic connectivity (fixed-point ×10⁶) |

## Constraints

1. `nInd × Σ(λᵢ²) = (Σλᵢ)²` — N_ind definition as division
2. `nInd > 0` — Non-zero spectral effective dimensionality
3. `lambda2 = sort(λ)[1]` — Fiedler value is second-smallest eigenvalue
4. `lambda2 ≥ 0` — Graph connectivity (non-negative Fiedler value)

## Fixed-Point Representation

All eigenvalues are represented as integers in fixed-point ×10⁶ to avoid floating-point arithmetic in the SNARK circuit.

Example: λ = 0.5 → 500000 in the circuit.

## On-Chain Mapping

The circuit outputs map directly to `VVULedger.sol::submitProof()`:

```
submitProof(graphCommit, nInd, lambda2, proof)
```

Where:
- `graphCommit` = Poseidon commitment (bytes32)
- `nInd` = N_ind value from circuit (uint256, fixed-point ×10⁶)
- `lambda2` = Fiedler value from circuit (uint256, fixed-point ×10⁶)
- `proof` = Groth16 proof bytes

## Compilation

```bash
# Compile the circuit
bash compile.sh

# Full proving pipeline (requires pot12_final.ptau)
bash prove.sh
```

## Prerequisites

- `circom` compiler (via Nix flake or `cargo install circom`)
- `snarkjs` (`npm install -g snarkjs`)
- Powers of Tau: `pot12_final.ptau` (download from Hermez ceremony)

## Drift-Control

This circuit contains NO forbidden terms: "truth", "confidence", "oracle", "proven" (for evidence), "zero false negatives", "risk: zero".
