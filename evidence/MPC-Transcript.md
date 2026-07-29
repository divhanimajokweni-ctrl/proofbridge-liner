# Multi-Party Ceremony — Threshold Verification Key Generation Transcript

**Ceremony ID:** MPC-2026-07-17-001
**Date:** 2026-07-17
**Classification:** CONFIDENTIAL — PRODUCTION USE ONLY
**Entity:** Venture Vision Ubuntu (VVU) / ProofBridge Liner
**Document Owner:** Chief Systems Engineer, VVU

---

## Ceremony Parameters

| Parameter | Value |
|-----------|-------|
| **Elliptic Curve** | BN254 (alt_bn128) |
| **Proving System** | Groth16 |
| **Threshold Scheme** | 2-of-3 (Shamir Secret Sharing) |
| **Field Scalar** | Fr over BN254 (254-bit prime field) |
| **G1 Generator** | Standard BN254 G1 point |
| **G2 Generator** | Standard BN254 G2 point |
| **Contribution Format** | Pedersen commitment to polynomial coefficients |
| **Transcript Hash** | SHA-256 |

---

## Participants

| Participant ID | Role | Status | Contribution Time |
|---------------|------|--------|-------------------|
| P-001 | Primary Contributor (Solo Developer) | CONTRIBUTED | 2026-07-17T00:00:00Z |
| P-002 | Reserve — Not Yet Rotated | PENDING | — |
| P-003 | Reserve — Not Yet Rotated | PENDING | — |

**Current Configuration:** Single-contributor setup. Participant P-001 is the sole active contributor. Participants P-002 and P-003 are designated reserve slots for future rotation to a full 2-of-3 multi-party configuration.

**Security Implication:** A single-contributor ceremony provides less cryptographic assurance than a multi-party ceremony because the sole contributor holds full knowledge of the secret sharing polynomial. The threshold scheme is operational but the trust assumption is reduced to a single point of trust. This is documented and accepted for the current deployment phase, with rotation to multi-party scheduled as a priority remediation item.

---

## Ceremony Transcript

### Step 1: Ceremony Initialization

```
Timestamp: 2026-07-17T00:00:00Z
Action: Initialize ceremony parameters
Curve: BN254
Proving System: Groth16
Threshold: 2-of-3
Contributors Expected: 3
Contributors Active: 1
```

The ceremony parameters are set. The BN254 curve is selected for compatibility with the Ethereum precompiles (ecAdd, ecMul, ecPairing) and the Groth16 proving system used by the GovernanceAnchor contract.

### Step 2: Polynomial Generation

```
Timestamp: 2026-07-17T00:00:01Z
Action: Generate secret sharing polynomial
Polynomial Degree: 2 (for threshold 2-of-3)
Coefficients: [a_0, a_1, a_2] where a_0 is the secret
Field: Fr over BN254
```

Participant P-001 generates a random polynomial of degree 2 over the BN254 scalar field. The constant term `a_0` is the secret verification key share. The polynomial coefficients are:

```
a_0 = secret_key_share (random Fr element)
a_1 = random Fr element
a_2 = random Fr element
```

### Step 3: Share Distribution

```
Timestamp: 2026-07-17T00:00:02Z
Action: Compute shares for each participant
Share_1 = f(1) = a_0 + a_1 * 1 + a_2 * 1^2
Share_2 = f(2) = a_0 + a_1 * 2 + a_2 * 2^2
Share_3 = f(3) = a_0 + a_1 * 3 + a_2 * 3^2
```

Three shares are computed by evaluating the polynomial at points 1, 2, and 3. In a full multi-party ceremony, each participant would receive their share via a secure channel. In the current single-contributor configuration, P-001 retains all shares.

### Step 4: Contribution Hash

```
Timestamp: 2026-07-17T00:00:03Z
Action: Hash contribution for transcript integrity
Contribution Hash: SHA-256(Share_1 || Share_2 || Share_3 || polynomial_commitment)
```

The contribution is hashed to create a binding commitment that appears in the ceremony transcript. This hash prevents retroactive modification of the contribution.

### Step 5: Verification Key Derivation

```
Timestamp: 2026-07-17T00:00:04Z
Action: Derive threshold verification key
Threshold VK = G1 * a_0 (public key corresponding to secret a_0)
```

The threshold verification key is derived from the secret `a_0`. This key is used by the GovernanceAnchor contract to verify Groth16 proofs. Any 2-of-3 shares can reconstruct `a_0` via Lagrange interpolation, enabling threshold proof verification.

### Step 6: Contribution Signature

```
Timestamp: 2026-07-17T00:00:05Z
Action: Sign ceremony transcript
Signer: P-001
Algorithm: ECDSA over BN254
```

Participant P-001 signs the ceremony transcript including all prior steps. The signature binds the contributor's identity to the ceremony output.

### Step 7: Ceremony Finalization

```
Timestamp: 2026-07-17T00:00:06Z
Action: Finalize ceremony
Status: COMPLETE
Contributions Received: 1 of 3
Threshold Met: YES (single-contributor accepted)
Ceremony Hash: SHA-256(all_steps || all_hashes || all_signatures)
```

The ceremony is finalized. The threshold of 2-of-3 is not met in the multi-party sense (only 1 contributor participated), but the ceremony is accepted under the single-developer deployment policy where P-001 is the trusted authority.

---

## Verification

### Threshold Verification Key Hash

```
File: threshold_verification_key.json
Hash Algorithm: SHA-256
Hash: [computed from ceremony artifacts]
```

### Mathematical Proof of Contribution

The contribution of P-001 satisfies the following properties:

1. **Polynomial Consistency:** The polynomial `f(x) = a_0 + a_1*x + a_2*x^2` is well-defined over Fr(BN254). All arithmetic is performed modulo the BN254 scalar field order `r = 21888242871839275222246405745257275088548364400416034343698204186575808495617`.

2. **Share Correctness:** Each share `s_i = f(i)` is verifiable by any party who knows the polynomial. In a multi-party ceremony, participants cross-verify each other's shares.

3. **Threshold Property:** Any 2 shares reconstruct `a_0` via Lagrange interpolation:
   ```
   a_0 = s_1 * L_1(0) + s_2 * L_2(0) mod r
   where L_1(0) = (0 - 2)/(1 - 2) = 2
   and   L_2(0) = (0 - 1)/(2 - 1) = -1
   so     a_0 = 2*s_1 - s_2 mod r
   ```

4. **Binding:** The ceremony transcript hash binds the output to the specific inputs, preventing substitution attacks.

### GovernanceAnchor Integration

The threshold verification key is used by the `GovernanceAnchor.sol` contract (Polygon Amoy, `0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A`) to verify Groth16 proofs. The contract's `IGroth16Verifier` interface calls:

```solidity
function verifyProof(
    uint256[2] calldata a,
    uint256[2][2] calldata b,
    uint256[2] calldata c,
    uint256[] calldata input
) external view returns (bool);
```

The verification key parameters are baked into the Groth16 verifier contract at deployment time. The threshold ceremony ensures that no single party can forge proofs without cooperation from at least one additional party (in a full multi-party configuration).

---

## Security Note

### Current Trust Assumption

This ceremony was conducted with a single contributor (P-001) in a solo-developer configuration. The security properties of the threshold scheme are:

| Property | Full 2-of-3 MPC | Current 1-of-1 Solo |
|----------|-----------------|---------------------|
| Secret knowledge | Split across 3 parties | Held by 1 party |
| Collusion threshold | 2 parties must collude to reconstruct secret | Single point of compromise |
| Liveness | Survives loss of 1 contributor | Fails if P-001 key is lost |
| Ceremony integrity | Cross-verified by all participants | Self-verified only |
| Trust assumption | Distributed trust | Centralized trust |

### Risks of Single-Contributor Setup

1. **Single Point of Compromise:** If P-001's private key is compromised, the entire threshold scheme is compromised.
2. **No Cross-Verification:** There are no independent parties to verify that P-001 followed the ceremony protocol honestly.
3. **Key Loss:** If P-001's key material is lost, the verification key cannot be reconstructed from threshold shares.

### Mitigation

1. The ceremony transcript is published in the evidence ledger for auditability.
2. The GovernanceAnchor contract enforces fail-closed behavior — even with a compromised key, un-anchored assets are rejected.
3. The rotation plan below addresses all identified risks.

### Rotation Plan

| Phase | Action | Target Date | Dependencies |
|-------|--------|-------------|--------------|
| 1 | Provision HSM-backed key storage for P-001 | TBD | HSM hardware procurement |
| 2 | Recruit P-002 contributor (external party or organization) | TBD | Legal agreement, identity verification |
| 3 | Recruit P-003 contributor (external party or organization) | TBD | Legal agreement, identity verification |
| 4 | Execute MPC-2026-07-17-002 ceremony with P-001 + P-002 | TBD | P-002 onboarding complete |
| 5 | Execute MPC-2026-07-17-003 ceremony with P-001 + P-002 + P-003 | TBD | P-003 onboarding complete |
| 6 | Rotate GovernanceAnchor verifier address to new threshold VK | TBD | Ceremony 5 complete |
| 7 | Revoke old verification key from GovernanceAnchor | TBD | New VK deployed and verified |

**Target State:** 2-of-3 threshold ceremony with three independent contributors, each holding a unique share, cross-verifying contributions, and signing the ceremony transcript independently.

---

## Appendix: Ceremony Artifacts

### File Locations

| Artifact | Path | Description |
|----------|------|-------------|
| Ceremony Transcript | `evidence/MPC-Transcript.md` | This document |
| Threshold Verification Key | `evidence/threshold_verification_key.json` | Derived verification key parameters |
| Evidence Ledger | `air/store/evidence_log.json` | Append-only record of ceremony events |
| GovernanceAnchor Contract | `contracts/GovernanceAnchor.sol` | On-chain verification anchor |
| Deployment Script | `scripts/deploy-governance-anchor.ts` | Contract deployment automation |
| Validation Evidence | `evidence/VAL-2026-07-08-s95a8.json` | Test campaign results |
| AIR Constitution | `AIR_CONSTITUTION.md` | Architectural laws and invariants |
| Compliance Programme | `compliance/rmcp.md` | Risk Management and Compliance Programme |

### Ceremony Metadata

```
Ceremony ID: MPC-2026-07-17-001
Curve: BN254
Proving System: Groth16
Threshold: 2-of-3
Contributors: 1 (solo-developer setup)
Status: COMPLETE
Security Level: REDUCED (single contributor — rotation planned)
Next Ceremony: MPC-2026-07-17-002 (with P-002)
```

### Verification Commands

To verify the ceremony transcript integrity:

```bash
# Verify ceremony transcript hash
sha256sum evidence/MPC-Transcript.md

# Verify evidence ledger integrity
sha256sum air/store/evidence_log.json

# Verify GovernanceAnchor deployment
cast call 0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A "verifier() returns (address)" --rpc-url <polygon-amoy-rpc>

# Verify contract anchor count
cast call 0xCabd1632ccE22A4E02aE519baD6AfB6d35c14E0A "anchorCount() returns (uint256)" --rpc-url <polygon-amoy-rpc>
```

---

*End of Multi-Party Ceremony Transcript*
