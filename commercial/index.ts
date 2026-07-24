// Epistemic Runtime v0.8 — Commercial Module Barrel Export
// Task 6-d: Cryptographic License Validation Framework
//
// All commercial modules require a valid VVU license.
// Use loadLicense() at boot time to initialize the license cache,
// then import commercial modules as needed.

export { loadLicense, requireFeature, getLicenseStatus } from './feature-gate';

// Commercial modules require valid license — feature-gated exports
export { TEEAttestation } from './tee-attestation';
export type { AttestationRequest, AttestationResult } from './tee-attestation';

export { ZKProverGPU } from './zk-prover-gpu';
export type { ZKProofRequest, ZKProofResult } from './zk-prover-gpu';

export { ComplianceAutomation } from './compliance-automation';
export type { ComplianceRequest, ComplianceResult } from './compliance-automation';

export { EnterpriseSSO } from './enterprise-sso';
export type { SSORequest, SSOResult } from './enterprise-sso';
