# Task: backend-core-group — Backend Core Implementation

## Task Overview
Implement 6 backend modules from the Master Implementation Blueprint:
- Module 1: shared/verifiers/interfaces.ts (VerifierRegistry DI)
- Module 2: open-source/air-kernel/evidence-compiler.ts (5-Pass Compiler)
- Module 3: shared/vetps/vetps-schema.ts (VETPS Adapter)
- Module 4: open-source/hbk-adapter/index.ts (HBK Adapter — updated from placeholder)
- Module 5: shared/tenant/identity.ts (Tenant Isolation)
- Module 6: open-source/safe-liner-basic/index.ts (DPI Proxy — updated from placeholder)

## Previous Work Context
- v0.8 project complete: dashboard, kernel, 57 vitest tests, license framework
- VVU EARTH TECH organizational structure with open-source/commercial/shared directories
- License schema with hard failure codes HF-001 through HF-012
- Kernel infrastructure: SHA-256 hashing (hashing.ts), RFC 8785 canonicalization, Ed25519 signing
- Placeholder modules existed for hbk-adapter and safe-liner-basic (throw NOT_IMPLEMENTED)

## Implementation Details

### Module 1: shared/verifiers/interfaces.ts
- VerifierRegistry interface with verifyTEE() and verifyZKProof()
- TEEVerificationResult: verified, platform, confidenceScore, failureCode HF-001
- ZKProofResult: verified, proverType, confidenceScore, failureCode HF-002
- ZKProofInput: circuitId, publicInputs, proofData

### Module 2: open-source/air-kernel/evidence-compiler.ts
- EvidenceCompiler class with optional VerifierRegistry DI
- 5-pass pipeline: Parse → Validate → Infer → Correlate → CodeGen
- Pass 3 (Infer): HF-001 for unverified TEE (0.69), HF-002 for unverified ZK (0.69)
- EvidenceIR, CodeGenArtifact, RawEvidenceInput, CompilationResult interfaces
- CodeGen produces: confidence_report, failure_fact, correlation_edge, policy_trigger, evidence_receipt

### Module 3: shared/vetps/vetps-schema.ts
- VETPSMetadataPacket: sha256_hash, timestamp, source_system, thermal_state, namespace
- VETPS_TelemetryPayload: metadata_packet, raw_buffer, domain_metrics
- VETPS_FilterStatePayload: brier_score, confidence_score, prior/posterior states
- VETPS_RelativityPayload: observation_id, causal_chain, mmr_proof_ref
- Constants: VETPS_SCHEMA_VERSION=1, MAX_BRIER_SCORE=0.10, THERMAL_THRESHOLDS

### Module 4: open-source/hbk-adapter/index.ts (updated)
- adaptTelemetry(): SHA-256 integrity check (HF-012 if mismatch), thermal state (HF-011)
- adaptFilterState(): Brier→confidence: max(0, 1 - brier/0.10)
- adaptRelativity(): causal chain ingestion with validation
- Deterministic, replay-safe, no Date.now/Math.random

### Module 5: shared/tenant/identity.ts
- deriveNamespace(publicKey) = SHA-256(tenantPublicKey)
- verifyNamespace(namespace, publicKey) for DPI proxy
- deriveIdentity(publicKey, timestamp) → TenantIdentity
- SignedEvidencePacket interface for DPI proxy inspection
- FailureFact interface for violation recording

### Module 6: open-source/safe-liner-basic/index.ts (updated)
- inspectPacket(): namespace verification (HF-007), Ed25519 signature verification (HF-007)
- DPIInspectionResult with detailed check results
- Uses ed25519 from @noble/curves (ES module import, not require)
- FailureFact emission on violations
- Deterministic, replay-safe

## Lint Status
- All new/modified files pass lint (0 errors, 0 warnings)
- Pre-existing earth-tech-ui error remains (not modified by this task)

## Key Decisions
- Used ES module import for @noble/curves/ed25519.js instead of require() in safe-liner-basic
- EvidenceCompiler uses VerifierRegistry DI pattern — OSS mode applies penalties, commercial mode gets full verification
- VETPS schemas use numeric timestamps (from injected clock) throughout
- All hard failure codes reference the canonical definitions in shared/license/license-schema.ts
