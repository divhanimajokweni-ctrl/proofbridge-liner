# VVU Platform – Changelog

*All notable changes to the VVU Constitution and governance documents will be documented in this file.*

*Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*

---

## [Unreleased]

### Added
- MASTER_SPEC.md (thin specification referencing Constitution v1.0.0)
- VERIFICATION.md (operational verification status with EVID references)
- CHANGELOG.md (this file)
- ADR-004 through ADR-009 (architectural decisions)
- Constitutional PR Gate workflow (.github/workflows/constitutional-pr-gate.yml)

### Changed
- MEMORY.md (removed stale documentation references, added governance file references)

### Deprecated
- None

### Removed
- None

### Fixed
- Stale documentation references in MEMORY.md (DOC-001)

### Security
- HF-001 closed: TEE attestation explicitly downgraded to software-attested (ADR-009)

---

## [1.0.0] - 2026-07-18

### Added

#### Constitution
- **Constitution v1.0.0** – Initial constitutional framework for VVU platform
  - Part 0: Constitutional Invariants (CI-001 to CI-010)
  - Part 1: Architecture (three surfaces, six bounded contexts)
  - Part 2: Security Specification (SEC-001 to SEC-015)
  - Part 3: Evidence Lifecycle Model
  - Part 4: Operational Model (Two Graphs)
  - Part 5: Commercial Model
  - Part 6: Governance Hierarchy
  - Part 7: Verification (Operational Reality)
  - Part 8: Execution Plan (Gated)
  - Part 9: Amendment Process
  - Part 10: Future Automation

#### ADRs
- **ADR-001** – Use Event Sourcing for State Management
- **ADR-002** – Use Ed25519 for Cryptographic Signatures
- **ADR-003** – Use RFC 8785 Canonical JSON

#### AIR ADRs
- **AIR ADR-001** – Adapter Boundary Integrity
- **AIR ADR-002** – Bayesian Calibration
- **AIR ADR-003** – HMAC Domain Separation
- **AIR ADR-004** – Normative Transitions
- **AIR ADR-005** – Quorum Registry
- **AIR ADR-006** – Trust Boundary Integrity

#### Trust Runtime
- Trust Runtime Kernel (packages/trust-runtime)
- Extended Runtime (src/lib/trust-runtime)
- Trust API (packages/trust-api)
- Trust Crypto (packages/trust-crypto)
- Trust Events (packages/trust-events)
- Trust Projections (packages/trust-projections)
- Trust Types (packages/trust-types)
- BartBot Agent (packages/bartbot)

#### AIR Kernel
- 5-pass compiler pipeline
- Evidence IR and Inference IR schemas
- Governance rules

#### Ubuntu Pools
- Pool creation and listing UI
- API routes for pool operations

#### Smart Contracts
- CircuitBreaker.sol
- CircuitBreakerV2.sol
- GovernanceAnchor.sol
- SafetyKernel.sol
- AssetRegistry.sol
- BayesianScorer.sol
- TEEVerifier.sol
- RescuePrimeHash.sol

#### ZK Circuits
- threshold.circom
- recursive_aggregator

#### Infrastructure
- CI/CD workflows (13)
- Docker Compose configuration
- Deployment loop
- Vercel deployment

### Changed
- None (initial version)

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Zero Trust Runtime architecture implemented
- Fail-closed responses for unknown states
- Event integrity (append-only logs)
- Idempotent mutations

---

## Amendment History

| Version | Date | Author | Approver | Changes | ADR |
|---------|------|--------|----------|---------|-----|
| v1.0.0 | 2026-07-18 | VVU Engineering | Founder | Initial constitution | – |

---

## Future Amendments

Amendments will be tracked here as they occur through the process defined in Part 9 of the Constitution.

**Process:**
1. ADR documenting problem, rationale, and impact
2. RFC if affecting external interfaces
3. Review by at least two technical leads
4. Approval by governance body
5. Version increment and changelog entry

---

*This changelog is authoritative upon approval. It tracks all normative changes to the VVU governance framework.*