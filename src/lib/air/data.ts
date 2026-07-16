/**
 * VVU AIR v3.1.0 — Static Initial Data Module
 * Codename: "Evidence Compiler"
 *
 * This is the data foundation for the AIR dashboard.
 * Every other AIR module imports from this file.
 *
 * Exports typed interfaces, static data arrays for capabilities,
 * constitutional rules, architectural patterns, ADRs, RFCs,
 * hard failures, constitutional debt items, and the AIR config.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CapabilityEvidence {
  readonly field: string;
  readonly description: string;
  readonly required: boolean;
  readonly collector: string;
}

export interface Capability {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly classification: "Core" | "Adopted" | "Hybrid";
  readonly maturity: "Experimental" | "Stable" | "Verified";
  readonly owner: string;
  readonly evidence: readonly CapabilityEvidence[];
  readonly hardFailures: readonly string[];
  readonly adapterBoundary: string;
  readonly exitStrategy: string;
  readonly tradeoffs: readonly string[];
  readonly recommendation: string;
  readonly advantage: string;
}

export interface Rule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly schema: readonly string[];
  readonly enabled: boolean;
}

export interface Pattern {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly applicability: readonly string[];
  readonly tradeoffs: readonly string[];
  readonly references: readonly string[];
}

export interface ADR {
  readonly id: string;
  readonly title: string;
  readonly status: "Proposed" | "Accepted" | "Deprecated" | "Superseded";
  readonly date: string;
  readonly context: string;
  readonly decision: string;
  readonly consequences: readonly string[];
  readonly relatedRules: readonly string[];
  readonly relatedCapabilities: readonly string[];
}

export interface RFC {
  readonly id: string;
  readonly title: string;
  readonly status: "Draft" | "Approved" | "Rejected" | "Withdrawn";
  readonly author: string;
  readonly date: string;
  readonly summary: string;
  readonly implementationNotes: string;
  readonly relatedAdrs: readonly string[];
}

export interface HardFailure {
  readonly id: string;
  readonly title: string;
  readonly severity: "Critical" | "High" | "Medium" | "Low";
  readonly description: string;
  readonly affectedCapabilities: readonly string[];
  readonly remediation: string;
  readonly blockedBy: readonly string[];
  readonly detectedAt: string;
  readonly status: "Open" | "Mitigated" | "Resolved";
  readonly evidence: string;
}

export interface ConstitutionalDebtItem {
  readonly id: string;
  readonly title: string;
  readonly severity: "Blocker" | "Critical" | "Major" | "Minor";
  readonly description: string;
  readonly introducedAt: string;
  readonly resolvedAt: string | null;
  readonly relatedHardFailures: readonly string[];
  readonly relatedCapabilities: readonly string[];
  readonly remediation: string;
  readonly owner: string;
}

export interface AIRConfig {
  readonly version: string;
  readonly codename: string;
  readonly status: "ACTIVE" | "BLOCKED" | "DEPRECATED" | "EXPERIMENTAL";
  readonly lastUpdated: string;
  readonly hardFailureCount: number;
  readonly openBlockerCount: number;
  readonly capabilityCount: number;
  readonly ruleCount: number;
  readonly patternCount: number;
  readonly adrCount: number;
  readonly rfcCount: number;
}

// ---------------------------------------------------------------------------
// CAPABILITIES
// ---------------------------------------------------------------------------

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "proofbridge-vc",
    title: "ProofBridge Verifiable Credential Platform",
    description:
      "End-to-end Verifiable Credential issuance platform that mints W3C-compliant VCs " +
      "with Ed25519 signatures, supports credential status revocation via StatusList2021, " +
      "and provides a holder wallet SDK for presentation exchange. The VC pipeline includes " +
      "schema validation, issuer DID resolution, and tamper-evident audit logging.",
    classification: "Core",
    maturity: "Stable",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "vcIssuanceLog",
        description: "Structured issuance log entries with timestamp, schema URI, and holder DID",
        required: true,
        collector: "proofbridge-audit-service",
      },
      {
        field: "signatureVerificationResult",
        description: "Ed25519 signature verification result for each issued credential",
        required: true,
        collector: "proofbridge-crypto-service",
      },
      {
        field: "schemaRegistryProof",
        description: "Merkle proof that the credential schema was registered in the schema registry",
        required: true,
        collector: "proofbridge-schema-service",
      },
      {
        field: "revocationStatusProof",
        description: "StatusList2021 bitmap proof for credential revocation status",
        required: false,
        collector: "proofbridge-revocation-service",
      },
      {
        field: "holderConsentRecord",
        description: "Holder consent record proving informed consent at issuance time",
        required: true,
        collector: "proofbridge-holder-wallet",
      },
    ],
    hardFailures: [],
    adapterBoundary:
      "VC issuance depends on the governance-anchor capability for on-chain issuer DID " +
      "resolution. If GovernanceAnchor.sol is undeployed on Polygon Amoy, issuer DID " +
      "resolution falls back to a local cache which is not tamper-evident.",
    exitStrategy:
      "Replace with a standards-compliant issuer that supports DID:web and DID:ethr. " +
      "The W3C VC Data Model 2.0 is the target standard. Migration requires re-issuing " +
      "all credentials with the new proof type.",
    tradeoffs: [
      "Ed25519 is faster than ECDSA but less widely supported in hardware wallets",
      "StatusList2021 bitmap approach leaks credential count metadata",
      "Holder wallet SDK adds client-side complexity but improves user sovereignty",
      "Local cache fallback reduces availability guarantees for issuer resolution",
    ],
    recommendation:
      "Maintain Ed25519 as the primary proof type. Add support for BBS+ signatures " +
      "for selective disclosure in v3.2.0. Ensure all credential issuance events are " +
      "written to the append-only evidence store.",
    advantage:
      "Full W3C VC compliance with tamper-evident audit trail. Holder-centric design " +
      "aligns with self-sovereign identity principles and GDPR data minimization.",
  },
  {
    id: "governance-anchor",
    title: "On-Chain Governance Anchor",
    description:
      "Smart contract deployed on Polygon Amoy testnet (GovernanceAnchor.sol) that " +
      "anchors governance decisions on-chain. Stores Merkle roots of capability state, " +
      "constitutional rule hashes, and RFC/ADR decision records. Provides immutable " +
      "proof of governance state at a given block height.",
    classification: "Core",
    maturity: "Experimental",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "contractDeploymentProof",
        description: "Polygon Amoy transaction hash proving contract deployment",
        required: true,
        collector: "polygon-amoy-explorer",
      },
      {
        field: "stateRootAnchoring",
        description: "On-chain Merkle root of the full AIR capability state",
        required: true,
        collector: "governance-anchor-service",
      },
      {
        field: "blockConfirmation",
        description: "Block confirmation count for each anchoring transaction",
        required: true,
        collector: "polygon-amoy-rpc",
      },
      {
        field: "ruleHashRegistry",
        description: "On-chain registry of constitutional rule hashes for tamper detection",
        required: true,
        collector: "governance-anchor-service",
      },
    ],
    hardFailures: ["HF-003"],
    adapterBoundary:
      "GovernanceAnchor.sol is currently undeployed on Polygon Amoy (HF-003). " +
      "All on-chain anchoring is inoperative. The system operates in offline mode " +
      "with governance state stored only in the local append-only evidence store.",
    exitStrategy:
      "Deploy GovernanceAnchor.sol to Polygon Amoy testnet. If Polygon migration " +
      "is required, redeploy to the target chain and re-anchor all governance state. " +
      "The contract ABI is chain-agnostic so redeployment only requires updating the " +
      "RPC endpoint and contract address.",
    tradeoffs: [
      "Polygon Amoy provides low gas costs but is a testnet with lower finality guarantees",
      "On-chain anchoring adds latency (~2s block time) to governance state updates",
      "Merkle root approach hides individual capability state from on-chain observers",
      "Testnet deployment means state is not production-grade and may be reset",
    ],
    recommendation:
      "Deploy GovernanceAnchor.sol to Polygon Amoy as the immediate priority. " +
      "Establish a re-anchoring schedule of every 100 blocks. Add a fallback " +
      "local anchoring mode for offline operation that can be synced later.",
    advantage:
      "Immutable on-chain proof of governance state enables third-party verification " +
      "of constitutional compliance without trusting the AIR runtime.",
  },
  {
    id: "zk-proof-verification",
    title: "Client-Side ZK Proof Verification",
    description:
      "Browser-based Zero-Knowledge proof verification using snarkjs and the Groth16 " +
      "proof system. Enables holders to prove credential attributes without revealing " +
      "underlying data. Verification circuits are compiled via circom and the verifier " +
      "keys are distributed to clients via a CDN with subresource integrity hashes.",
    classification: "Core",
    maturity: "Experimental",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "circuitCompilationLog",
        description: "Circom circuit compilation log with constraint count and verification key hash",
        required: true,
        collector: "circom-build-pipeline",
      },
      {
        field: "clientVerificationResult",
        description: "Client-side verification result including proof validity and public inputs",
        required: true,
        collector: "proofbridge-holder-wallet",
      },
      {
        field: "verifierKeyIntegrity",
        description: "SRI hash of the distributed verifier key file",
        required: true,
        collector: "proofbridge-cdn-service",
      },
      {
        field: "proofGenerationMetrics",
        description: "Proof generation timing and memory usage metrics",
        required: false,
        collector: "proofbridge-telemetry",
      },
    ],
    hardFailures: ["HF-002"],
    adapterBoundary:
      "Client-side ZK proofs are generated but not verified on-chain (HF-002). " +
      "The verifier contract has not been deployed, so proof validity is only " +
      "checked client-side. This means proofs cannot be used as evidence in the " +
      "governance anchor and rely on client honesty.",
    exitStrategy:
      "Deploy the Groth16 verifier contract on-chain. If the proof system needs to " +
      "change (e.g., to PLONK), recompile circuits and redistribute verifier keys. " +
      "The snarkjs library supports multiple proof systems so migration is feasible.",
    tradeoffs: [
      "Groth16 has the smallest proofs and fastest verification but requires per-circuit trusted setup",
      "Client-side verification reduces server load but increases client-side attack surface",
      "SRI hashes protect against CDN compromise but require manual key rotation",
      "Circom has a large ecosystem but constraint count limits circuit complexity",
    ],
    recommendation:
      "Deploy the verifier contract on-chain as the immediate priority. Add " +
      "server-side proof verification as a fallback for clients that cannot " +
      "perform client-side verification. Migrate to a universal trusted setup " +
      "proof system in v4.0.0.",
    advantage:
      "ZK proofs enable privacy-preserving credential verification, allowing " +
      "holders to prove attributes (e.g., age over 18) without revealing the " +
      "full credential or underlying personal data.",
  },
  {
    id: "tee-attestation",
    title: "Trusted Execution Environment Attestation",
    description:
      "Integration with hardware TEE platforms (AMD SEV-SNP, Intel SGX, AWS Nitro) " +
      "to provide remote attestation of the AIR runtime environment. Attestation " +
      "reports include PCR measurements, platform configuration values, and runtime " +
      "identity claims that are verified against known-good values.",
    classification: "Core",
    maturity: "Experimental",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "attestationReport",
        description: "Hardware-generated attestation report with signature and PCR values",
        required: true,
        collector: "tee-attestation-service",
      },
      {
        field: "pcerMeasurement",
        description: "Platform Configuration Register measurements of the AIR runtime",
        required: true,
        collector: "tee-attestation-service",
      },
      {
        field: "attestationVerificationResult",
        description: "Result of verifying the attestation report against known-good values",
        required: true,
        collector: "tee-verification-service",
      },
      {
        field: "platformIdentityClaim",
        description: "Signed platform identity claim from the hardware vendor",
        required: true,
        collector: "tee-attestation-service",
      },
    ],
    hardFailures: ["HF-001"],
    adapterBoundary:
      "TEE attestation is currently a boolean config flag rather than real hardware " +
      "attestation (HF-001). The `ATTED_ATTESTED=true` flag bypasses actual TEE " +
      "verification, meaning the system claims attestation without hardware evidence. " +
      "This is a fundamental constitutional violation.",
    exitStrategy:
      "Replace the boolean config flag with actual hardware attestation verification. " +
      "Integrate with AMD SEV-SNP attestation API for the production environment. " +
      "If no TEE hardware is available, disable the capability entirely rather than " +
      "faking attestation.",
    tradeoffs: [
      "Real hardware attestation adds ~200ms latency to each request",
      "AMD SEV-SNP requires specific kernel and firmware versions",
      "AWS Nitro attestation is vendor-locked to AWS infrastructure",
      "Removing the config flag will break existing deployments that rely on it",
    ],
    recommendation:
      "Immediately remove the boolean config flag and implement real attestation " +
      "verification. Start with AMD SEV-SNP as the primary platform. Add a " +
      "graceful degradation mode that disables TEE-dependent features when " +
      "real hardware attestation is not available.",
    advantage:
      "Hardware-backed attestation provides the strongest possible assurance that " +
      "the AIR runtime has not been tampered with, protecting against even " +
      "privileged software attackers.",
  },
  {
    id: "hmac-webhook",
    title: "HMAC-Authenticated Webhook Processing",
    description:
      "Webhook ingestion pipeline with HMAC-SHA256 authentication, replay protection " +
      "via nonce tracking, and domain-separated key namespaces. Each webhook source " +
      "has a unique HMAC key that is rotated on a configurable schedule. The pipeline " +
      "validates signatures, checks nonce freshness, and routes to the appropriate " +
      "capability handler.",
    classification: "Core",
    maturity: "Stable",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "hmacKeyRotationLog",
        description: "Log of HMAC key rotations including source ID, rotation timestamp, and key version",
        required: true,
        collector: "hmac-key-service",
      },
      {
        field: "webhookSignatureValidation",
        description: "HMAC-SHA256 signature validation result for each incoming webhook",
        required: true,
        collector: "webhook-ingestion-service",
      },
      {
        field: "nonceTrackingProof",
        description: "Proof that nonces are tracked and replay attacks are prevented",
        required: true,
        collector: "webhook-ingestion-service",
      },
      {
        field: "domainSeparationProof",
        description: "Proof that HMAC keys use domain-separated namespaces per webhook source",
        required: true,
        collector: "hmac-key-service",
      },
    ],
    hardFailures: [],
    adapterBoundary:
      "Webhook HMAC key management is implemented but domain separation is not " +
      "enforced in the pipeline (CD-002). The current implementation uses a single " +
      "key namespace for all webhook sources, which means a compromised key from one " +
      "source could forge webhooks from another source.",
    exitStrategy:
      "Implement domain-separated HMAC key namespaces. Each webhook source gets " +
      "a unique prefix in the key namespace (e.g., `vc-issuance:`, `governance:`). " +
      "Key rotation is per-source so a compromise of one source does not affect others.",
    tradeoffs: [
      "Domain separation adds key management complexity",
      "Per-source key rotation requires coordination between key service and webhook sources",
      "HMAC-SHA256 is fast but does not provide non-repudiation like asymmetric signatures",
      "Nonce tracking requires persistent storage which adds operational complexity",
    ],
    recommendation:
      "Enforce domain-separated key namespaces immediately. Implement per-source " +
      "key rotation with automated coordination. Add webhook source allowlisting " +
      "as an additional defense layer.",
    advantage:
      "HMAC authentication with domain separation provides strong webhook integrity " +
      "guarantees while maintaining the simplicity of symmetric cryptography for " +
      "high-throughput webhook processing.",
  },
  {
    id: "bayesian-calibration",
    title: "Bayesian Prior Calibration for Risk Scoring",
    description:
      "Bayesian inference engine that calibrates prior probabilities for AIR risk " +
      "scoring using historical evidence data. Implements Beta-Binomial conjugate " +
      "priors with automatic updating as new evidence arrives. The calibration " +
      "pipeline requires a minimum dataset size of n=200 cases to produce " +
      "statistically reliable posterior distributions.",
    classification: "Hybrid",
    maturity: "Experimental",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "calibrationDatasetSize",
        description: "Total number of cases in the calibration dataset",
        required: true,
        collector: "bayesian-calibration-service",
      },
      {
        field: "posteriorDistribution",
        description: "Computed posterior distribution parameters (alpha, beta) after calibration",
        required: true,
        collector: "bayesian-calibration-service",
      },
      {
        field: "priorPosteriorComparison",
        description: "Comparison of prior and posterior distributions showing calibration effect",
        required: true,
        collector: "bayesian-calibration-service",
      },
      {
        field: "calibrationConfidenceInterval",
        description: "Credible interval for the calibrated probability estimate",
        required: true,
        collector: "bayesian-calibration-service",
      },
    ],
    hardFailures: [],
    adapterBoundary:
      "Bayesian calibration dataset is below the n=200 minimum threshold (CD-003). " +
      "With fewer than 200 cases, the posterior distribution is dominated by the " +
      "prior and does not provide meaningful calibration. Risk scores produced in " +
      "this state are effectively prior-only estimates.",
    exitStrategy:
      "Collect sufficient historical evidence data to reach n=200 cases. In the " +
      "meantime, disable automatic prior updating and use a fixed, manually " +
      "validated prior. If the dataset cannot reach n=200, consider switching to " +
      "a non-parametric calibration method.",
    tradeoffs: [
      "Beta-Binomial conjugate priors are computationally efficient but assume binary outcomes",
      "Minimum n=200 threshold ensures statistical reliability but delays capability activation",
      "Automatic updating reduces manual calibration effort but requires trustworthy input data",
      "Fixed prior fallback is simpler but does not adapt to changing evidence patterns",
    ],
    recommendation:
      "Collect historical evidence data to reach the n=200 threshold. Implement " +
      "data quality checks on incoming evidence to prevent contamination of the " +
      "calibration dataset. Add a monitoring dashboard for dataset size and " +
      "posterior distribution stability.",
    advantage:
      "Bayesian calibration provides a principled, statistically rigorous method " +
      "for combining prior knowledge with observed evidence to produce calibrated " +
      "risk scores with quantified uncertainty.",
  },
  {
    id: "compliance-os",
    title: "Compliance Operating System",
    description:
      "Compliance Operating System ingested from the older compliance-fabric project. " +
      "Provides a rules engine for regulatory compliance checks, evidence collection " +
      "and retention management, and automated compliance reporting. The system has " +
      "been partially migrated to the AIR Evidence IR format but retains legacy " +
      "evidence formats from compliance-fabric v2.",
    classification: "Adopted",
    maturity: "Stable",
    owner: "ProofBridge Core Team",
    evidence: [
      {
        field: "complianceRuleExecutionLog",
        description: "Log of compliance rule executions with rule ID, result, and timestamp",
        required: true,
        collector: "compliance-os-engine",
      },
      {
        field: "evidenceRetentionProof",
        description: "Proof that evidence is retained according to the retention policy",
        required: true,
        collector: "compliance-os-retention",
      },
      {
        field: "complianceReportHash",
        description: "SHA-256 hash of the generated compliance report for tamper detection",
        required: true,
        collector: "compliance-os-reporting",
      },
      {
        field: "legacyEvidenceFormatFlag",
        description: "Flag indicating whether legacy compliance-fabric v2 evidence format is in use",
        required: true,
        collector: "compliance-os-migration",
      },
    ],
    hardFailures: [],
    adapterBoundary:
      "Compliance OS evidence format has not been fully migrated to the Evidence IR " +
      "format (CD-001). The system currently accepts both legacy compliance-fabric v2 " +
      "format and the new Evidence IR format, but legacy format evidence cannot be " +
      "verified by the AIR verification pipeline.",
    exitStrategy:
      "Complete migration of all compliance-fabric v2 evidence to the Evidence IR " +
      "format. Add a format conversion layer that automatically translates legacy " +
      "evidence on ingestion. Remove legacy format support after all evidence is migrated.",
    tradeoffs: [
      "Ingesting from compliance-fabric provides proven compliance rules but adds legacy complexity",
      "Dual-format evidence acceptance increases the attack surface",
      "Evidence IR format is more structured but requires conversion effort",
      "Automated migration reduces manual effort but may lose nuance in legacy evidence",
    ],
    recommendation:
      "Prioritize Evidence IR migration. Implement an automated format conversion " +
      "layer. Set a hard deadline for removing legacy format support. Document " +
      "all format differences and edge cases in the migration guide.",
    advantage:
      "Compliance OS provides a battle-tested compliance rules engine that has been " +
      "validated in production environments. Ingesting it into AIR preserves this " +
      "validation while enabling integration with the AIR evidence pipeline.",
  },
];

// ---------------------------------------------------------------------------
// RULES
// ---------------------------------------------------------------------------

export const RULES: readonly Rule[] = [
  {
    id: "TrustBoundaryIntegrity",
    title: "Trust Boundary Integrity Rule",
    description:
      "The tee-attestation capability MUST use real hardware attestation from " +
      "AMD SEV-SNP, Intel SGX, or AWS Nitro. It MUST NOT rely on boolean configuration " +
      "flags or environment variables to assert attestation status. Any claim of TEE " +
      "attestation without corresponding hardware evidence is a constitutional violation " +
      "that blocks the AIR runtime.",
    schema: [
      "attestationReport",
      "pcerMeasurement",
      "attestationVerificationResult",
      "platformIdentityClaim",
    ],
    enabled: true,
  },
  {
    id: "AdapterBoundaryIntegrity",
    title: "Adapter Boundary Integrity Rule",
    description:
      "The governance-anchor capability MUST have GovernanceAnchor.sol deployed and " +
      "verified on Polygon Amoy. ZK proofs from the zk-proof-verification capability " +
      "MUST be verified on-chain by a deployed verifier contract. The adapter boundary " +
      "between the AIR runtime and on-chain verification MUST be demonstrable with " +
      "transaction receipts and block confirmations.",
    schema: [
      "contractDeploymentProof",
      "stateRootAnchoring",
      "blockConfirmation",
      "clientVerificationResult",
    ],
    enabled: true,
  },
  {
    id: "HmacDomainSeparation",
    title: "HMAC Domain Separation Rule",
    description:
      "The hmac-webhook capability MUST use domain-separated HMAC key namespaces. " +
      "Webhook source keys and VC template HMAC keys MUST NOT share key material or " +
      "key namespaces. Each webhook source MUST have a unique key prefix. Key rotation " +
      "MUST be per-source and MUST be logged with source ID, rotation timestamp, and " +
      "key version.",
    schema: [
      "hmacKeyRotationLog",
      "webhookSignatureValidation",
      "nonceTrackingProof",
      "domainSeparationProof",
    ],
    enabled: true,
  },
  {
    id: "BayesianCalibration",
    title: "Bayesian Calibration Minimum Dataset Rule",
    description:
      "The bayesian-calibration capability MUST have a minimum dataset size of n=200 " +
      "cases before producing calibrated risk scores. Prior calibration with fewer " +
      "than 200 cases MUST be flagged as unreliable and MUST NOT be used for " +
      "decision-making. The calibration confidence interval MUST be reported alongside " +
      "the posterior distribution.",
    schema: [
      "calibrationDatasetSize",
      "posteriorDistribution",
      "priorPosteriorComparison",
      "calibrationConfidenceInterval",
    ],
    enabled: true,
  },
  {
    id: "NormativeTransition",
    title: "Normative Transition Rule",
    description:
      "RFC 2119 tag transitions (MUST → SHOULD → MAY) MUST NOT weaken binding " +
      "obligations without explicit governance approval. Any change to the normative " +
      "binding of a capability's evidence requirements MUST go through the RFC process " +
      "and be approved by the governance quorum. Retroactive weakening of obligations " +
      "is prohibited.",
    schema: [
      "rfcApprovalRecord",
      "governanceQuorumVote",
      "normativeTagChangeLog",
    ],
    enabled: true,
  },
  {
    id: "QuorumRegistry",
    title: "Quorum Registry Rule",
    description:
      "Each capability MUST have evidence from at least 2 distinct collectors. " +
      "Evidence from a single collector is insufficient for constitutional compliance. " +
      "The quorum registry MUST track collector identity, evidence field, and " +
      "verification timestamp for each piece of evidence submitted to the AIR runtime.",
    schema: [
      "quorumRegistryEntry",
      "collectorIdentityProof",
      "evidenceVerificationTimestamp",
    ],
    enabled: true,
  },
];

// ---------------------------------------------------------------------------
// PATTERNS
// ---------------------------------------------------------------------------

export const PATTERNS: readonly Pattern[] = [
  {
    id: "event-sourcing",
    title: "Event Sourcing",
    description:
      "All state changes in the AIR runtime are captured as an immutable sequence " +
      "of events. Current state is derived by replaying events from the beginning. " +
      "Events are stored in an append-only log with cryptographic hashes linking " +
      "each event to its predecessor, forming a tamper-evident chain.",
    applicability: [
      "AIR runtime state management",
      "Evidence store operations",
      "Governance decision recording",
      "Capability lifecycle transitions",
    ],
    tradeoffs: [
      "Event replay for state derivation can be slow for large event histories",
      "Event schema evolution requires careful versioning to maintain replay compatibility",
      "Snapshotting is required for performance but introduces non-event state",
      "Event ordering is critical and requires coordinated sequence generation",
    ],
    references: [
      "ADR-001: Event Sourcing for State Management",
      "RFC-001: Event Sourcing Adoption",
    ],
  },
  {
    id: "cqrs",
    title: "Command Query Responsibility Segregation",
    description:
      "Separates command (write) and query (read) operations into distinct models. " +
      "Commands are validated against constitutional rules before being applied. " +
      "Queries read from materialized views that are optimized for specific " +
      "access patterns. This separation enables independent scaling and optimization " +
      "of read and write paths.",
    applicability: [
      "AIR dashboard data access",
      "Evidence query optimization",
      "Capability status reporting",
      "Governance decision queries",
    ],
    tradeoffs: [
      "Eventual consistency between write and read models requires careful handling",
      "Materialized view maintenance adds operational complexity",
      "Separate models increase code surface area",
      "Debugging across command and query boundaries can be challenging",
    ],
    references: [
      "ADR-001: Event Sourcing for State Management",
    ],
  },
  {
    id: "circuit-breaker",
    title: "Circuit Breaker",
    description:
      "Wraps external service calls (on-chain RPC, TEE attestation APIs, webhook " +
      "sources) in a circuit breaker that detects failures and short-circuits " +
      "subsequent calls. The circuit breaker has three states: Closed (normal), " +
      "Open (failing, all calls short-circuited), and Half-Open (testing recovery). " +
      "This prevents cascade failures and gives failed services time to recover.",
    applicability: [
      "Polygon Amoy RPC calls",
      "TEE attestation API calls",
      "External webhook source calls",
      "ZK proof verification API calls",
    ],
    tradeoffs: [
      "Circuit breaker state adds complexity to error handling",
      "Half-Open state requires careful tuning of recovery thresholds",
      "Short-circuiting may mask transient failures",
      "Per-service circuit breakers require resource tracking",
    ],
    references: [
      "HARD_FAILURES: HF-003 (GovernanceAnchor undeployed triggers circuit breaker)",
    ],
  },
  {
    id: "outbox-pattern",
    title: "Outbox Pattern",
    description:
      "Ensures reliable event publication by writing events to a local outbox table " +
      "within the same transaction as the state change. A separate poller or CDC " +
      "process reads from the outbox and publishes events to the event log. This " +
      "guarantees at-least-once delivery without distributed transactions.",
    applicability: [
      "Evidence store event publication",
      "Governance anchor state synchronization",
      "Webhook event forwarding",
      "Cross-capability event propagation",
    ],
    tradeoffs: [
      "Outbox polling adds latency to event delivery",
      "At-least-once delivery requires idempotent event handlers",
      "Outbox table growth requires periodic cleanup",
      "CDC-based outbox adds infrastructure complexity",
    ],
    references: [
      "ADR-001: Event Sourcing for State Management",
      "ADR-005: Append-Only Evidence Store",
    ],
  },
  {
    id: "saga",
    title: "Saga Pattern",
    description:
      "Manages long-running, multi-step transactions across capabilities using " +
      "a sequence of local transactions with compensating actions for rollback. " +
      "Each step in the saga is an atomic local transaction that emits events " +
      "triggering the next step. If a step fails, compensating actions are " +
      "executed in reverse order to maintain consistency.",
    applicability: [
      "VC issuance workflow (issuance → anchoring → notification)",
      "Governance decision workflow (proposal → vote → anchoring)",
      "Capability lifecycle transitions (experimental → stable → verified)",
      "Evidence migration workflows",
    ],
    tradeoffs: [
      "Compensating actions may not perfectly undo the original action",
      "Saga orchestration adds significant complexity to multi-step workflows",
      "Long-running sagas require persistent state management",
      "Debugging saga failures requires tracing across multiple steps and compensations",
    ],
    references: [
      "ADR-007: Compliance OS Integration into AIR Runtime",
      "RFC-005: Compliance Fabric v2 to AIR Migration",
    ],
  },
  {
    id: "strangler-fig",
    title: "Strangler Fig Pattern",
    description:
      "Incrementally migrates functionality from the legacy compliance-fabric " +
      "system to the AIR runtime by routing specific requests to the new system " +
      "while leaving others on the old system. Over time, the new system " +
      "replaces the old system as more functionality is migrated. The old system " +
      "is eventually decommissioned when all requests are routed to the new system.",
    applicability: [
      "Compliance OS migration from compliance-fabric v2",
      "Evidence format migration from legacy to Evidence IR",
      "Capability migration from compliance-fabric to AIR",
      "Gradual rollout of new constitutional rules",
    ],
    tradeoffs: [
      "Running two systems in parallel increases operational cost and complexity",
      "Routing logic adds latency and potential for routing errors",
      "Feature parity between old and new systems may be difficult to achieve",
      "Decommission timing requires careful monitoring of migration completeness",
    ],
    references: [
      "ADR-007: Compliance OS Integration into AIR Runtime",
      "RFC-005: Compliance Fabric v2 to AIR Migration",
    ],
  },
];

// ---------------------------------------------------------------------------
// ADRs
// ---------------------------------------------------------------------------

export const ADRS: readonly ADR[] = [
  {
    id: "ADR-001",
    title: "Event Sourcing for State Management",
    status: "Accepted",
    date: "2025-09-15",
    context:
      "The AIR runtime requires a state management approach that provides a " +
      "complete audit trail of all state changes, supports time-travel debugging, " +
      "and enables replay of events for state reconstruction. Traditional CRUD " +
      "databases lose the history of changes, making it impossible to verify " +
      "the provenance of current state.",
    decision:
      "Adopt Event Sourcing as the primary state management pattern for the AIR " +
      "runtime. All state changes are captured as immutable events in an append-only " +
      "log. Current state is derived by replaying events. Events are cryptographically " +
      "hashed to form a tamper-evident chain.",
    consequences: [
      "All state changes are fully auditable and replayable",
      "State reconstruction requires event replay which may be slow for large histories",
      "Event schema versioning is required for long-term evolution",
      "Snapshotting must be implemented for performance optimization",
      "Existing CRUD operations must be migrated to event-based operations",
    ],
    relatedRules: ["QuorumRegistry", "NormativeTransition"],
    relatedCapabilities: ["proofbridge-vc", "governance-anchor", "compliance-os"],
  },
  {
    id: "ADR-002",
    title: "Ed25519 Signatures for VCT Governance",
    status: "Accepted",
    date: "2025-10-01",
    context:
      "VCT (Verifiable Credential Token) governance operations require a " +
      "signature scheme that is fast, has small signatures, and is supported " +
      "by the W3C DID ecosystem. ECDSA was considered but has larger signatures " +
      "and slower verification. RSA is too slow for high-throughput operations.",
    decision:
      "Use Ed25519 as the primary signature scheme for VCT governance operations. " +
      "Ed25519 provides 64-byte signatures, fast signing and verification, and " +
      "is supported by the majority of DID methods and W3C VC libraries.",
    consequences: [
      "Faster signing and verification compared to ECDSA and RSA",
      "Smaller signatures reduce storage and bandwidth requirements",
      "Ed25519 is not supported by all hardware wallets (limited hardware support)",
      "W3C VC Data Model 2.0 supports Ed25519 as a recommended algorithm",
      "Migration from ECDSA requires re-signing all existing governance records",
    ],
    relatedRules: ["TrustBoundaryIntegrity", "AdapterBoundaryIntegrity"],
    relatedCapabilities: ["proofbridge-vc", "governance-anchor"],
  },
  {
    id: "ADR-003",
    title: "Canonical JSON for Deterministic Hashing",
    status: "Accepted",
    date: "2025-10-15",
    context:
      "The AIR runtime needs to hash JSON objects deterministically for Merkle " +
      "tree construction and evidence integrity verification. Standard JSON " +
      "serialization is not deterministic — key order, whitespace, and numeric " +
      "representation can vary between implementations, producing different " +
      "hashes for semantically identical objects.",
    decision:
      "Use canonical JSON (RFC 8785 / JCS) for all deterministic hashing operations. " +
      "Canonical JSON sorts object keys lexicographically, uses minimal numeric " +
      "representation, and produces a single canonical form for any given JSON value. " +
      "All Merkle tree nodes and evidence hashes use canonical JSON serialization.",
    consequences: [
      "Deterministic hashing ensures consistent Merkle roots across implementations",
      "Canonical JSON is a well-defined standard (RFC 8785) with multiple implementations",
      "Performance overhead of canonical serialization is negligible for typical evidence sizes",
      "All existing JSON hashing code must be migrated to canonical JSON",
      "Test vectors must be established to verify cross-implementation compatibility",
    ],
    relatedRules: ["TrustBoundaryIntegrity", "AdapterBoundaryIntegrity"],
    relatedCapabilities: [
      "proofbridge-vc",
      "governance-anchor",
      "zk-proof-verification",
    ],
  },
  {
    id: "ADR-004",
    title: "AIR Multi-Pass Compiler Pipeline",
    status: "Proposed",
    date: "2025-12-01",
    context:
      "The AIR runtime processes evidence through multiple validation and " +
      "transformation stages. A single-pass approach couples validation logic " +
      "and makes it difficult to add new validation rules or modify existing " +
      "ones without affecting the entire pipeline. The system needs a composable, " +
      "extensible pipeline architecture.",
    decision:
      "Implement a multi-pass compiler pipeline for evidence processing. Each pass " +
      "is an independent, composable transformation that operates on the evidence " +
      "Intermediate Representation (Evidence IR). Passes include: schema validation, " +
      "signature verification, semantic analysis, constitutional rule checking, " +
      "and output formatting. Passes can be enabled, disabled, or reordered per " +
      "configuration.",
    consequences: [
      "New validation rules can be added as independent passes without modifying existing ones",
      "Pass ordering can be optimized for performance (e.g., cheap validations first)",
      "Each pass is independently testable and replaceable",
      "Pipeline configuration adds operational complexity",
      "Evidence IR format must be stable to support pass composition",
      "Debugging across multiple passes requires pass-level tracing",
    ],
    relatedRules: [
      "TrustBoundaryIntegrity",
      "AdapterBoundaryIntegrity",
      "QuorumRegistry",
    ],
    relatedCapabilities: [
      "proofbridge-vc",
      "governance-anchor",
      "zk-proof-verification",
      "tee-attestation",
      "hmac-webhook",
      "bayesian-calibration",
      "compliance-os",
    ],
  },
  {
    id: "ADR-005",
    title: "Append-Only Evidence Store",
    status: "Proposed",
    date: "2025-12-15",
    context:
      "The AIR runtime requires an evidence store that provides tamper-evidence, " +
      "immutable storage, and append-only semantics. Mutable storage allows " +
      "evidence to be altered or deleted after submission, which undermines the " +
      "integrity of the entire compliance and governance system.",
    decision:
      "Implement the evidence store as an append-only log with cryptographic " +
      "hash chaining. Each evidence entry includes a hash of the previous entry, " +
      "forming a tamper-evident chain. Entries cannot be modified or deleted — " +
      "corrections are made by appending new entries that reference and invalidate " +
      "previous entries. The store supports Merkle proofs for selective disclosure.",
    consequences: [
      "All evidence is tamper-evident and immutable once stored",
      "Corrections require appending new entries rather than modifying existing ones",
      "Storage grows monotonically and requires periodic compaction",
      "Merkle proofs enable selective disclosure of evidence without revealing the full store",
      "The append-only constraint must be enforced at the storage layer, not the application layer",
    ],
    relatedRules: ["QuorumRegistry", "NormativeTransition"],
    relatedCapabilities: [
      "proofbridge-vc",
      "governance-anchor",
      "compliance-os",
    ],
  },
  {
    id: "ADR-006",
    title: "Explainable Confidence Scoring",
    status: "Proposed",
    date: "2026-01-10",
    context:
      "AIR risk scores and confidence levels must be explainable to support " +
      "governance decision-making and regulatory compliance. Black-box scoring " +
      "without derivation trails makes it impossible to audit or challenge " +
      "decisions. The Bayesian calibration engine produces probability estimates " +
      "but the derivation from evidence to score must be transparent.",
    decision:
      "Implement explainable confidence scoring with full derivation trails. Each " +
      "confidence score includes: the input evidence, the Bayesian prior used, " +
      "the likelihood function applied, the posterior distribution computed, and " +
      "the decision threshold selected. Derivation trails are stored in the " +
      "append-only evidence store and are available for audit.",
    consequences: [
      "All confidence scores are fully auditable with complete derivation trails",
      "Governance decisions based on confidence scores can be challenged with evidence",
      "Derivation trail storage increases evidence store size",
      "Explanation generation adds latency to the scoring pipeline",
      "Regulatory compliance is improved through transparent decision-making",
    ],
    relatedRules: ["BayesianCalibration", "NormativeTransition"],
    relatedCapabilities: ["bayesian-calibration"],
  },
  {
    id: "ADR-007",
    title: "Compliance OS Integration into AIR Runtime",
    status: "Proposed",
    date: "2026-02-01",
    context:
      "The compliance-fabric project provides a proven compliance rules engine " +
      "that has been validated in production. The AIR runtime needs compliance " +
      "capabilities but building a new compliance engine from scratch would " +
      "duplicate effort and lose the battle-tested validation of the existing system. " +
      "Integration must preserve the compliance engine's guarantees while " +
      "migrating to the AIR Evidence IR format.",
    decision:
      "Integrate the compliance-fabric compliance rules engine into the AIR runtime " +
      "as the Compliance Operating System capability. Use the Strangler Fig pattern " +
      "for gradual migration. Implement a format conversion layer that translates " +
      "compliance-fabric v2 evidence to Evidence IR. Set a hard deadline for removing " +
      "legacy format support.",
    consequences: [
      "Proven compliance rules are preserved without rebuilding from scratch",
      "Dual-format evidence acceptance increases attack surface during migration",
      "Strangler Fig pattern allows gradual migration with rollback capability",
      "Legacy format support must be removed after migration deadline",
      "Compliance OS evidence must be verified by the AIR verification pipeline",
    ],
    relatedRules: ["NormativeTransition", "QuorumRegistry"],
    relatedCapabilities: ["compliance-os"],
  },
];

// ---------------------------------------------------------------------------
// RFCs
// ---------------------------------------------------------------------------

export const RFCS: readonly RFC[] = [
  {
    id: "RFC-001",
    title: "Event Sourcing Adoption",
    status: "Approved",
    author: "ProofBridge Core Team",
    date: "2025-09-20",
    summary:
      "Proposes adopting Event Sourcing as the primary state management pattern " +
      "for the AIR runtime. All state changes are captured as immutable events " +
      "in an append-only log, enabling full audit trails, time-travel debugging, " +
      "and state reconstruction from event replay.",
    implementationNotes:
      "Implemented via ADR-001. Event store uses append-only log with cryptographic " +
      "hash chaining. Snapshots are taken every 1000 events for performance. " +
      "Event schema versioning follows semver with backward-compatible evolution. " +
      "Migration from existing CRUD stores was completed in Q4 2025.",
    relatedAdrs: ["ADR-001"],
  },
  {
    id: "RFC-003",
    title: "Telemetry Drift Detection",
    status: "Approved",
    author: "ProofBridge Core Team",
    date: "2025-11-15",
    summary:
      "Establishes a telemetry drift detection system that monitors AIR runtime " +
      "metrics for statistical anomalies. Uses Bayesian change-point detection " +
      "to identify drift in key metrics (latency, error rates, evidence verification " +
      "success rates) and alerts when drift exceeds configurable thresholds.",
    implementationNotes:
      "Implemented using a sliding window approach with 1000-event windows. " +
      "Change-point detection uses the Bayesian Online Changepoint Detection " +
      "algorithm. Alerts are emitted as events to the AIR event log. Drift " +
      "detection runs on a 60-second cycle. Threshold tuning was completed " +
      "using historical data from Q3 2025.",
    relatedAdrs: ["ADR-006"],
  },
  {
    id: "RFC-005",
    title: "Compliance Fabric v2 to AIR Migration",
    status: "Approved",
    author: "ProofBridge Core Team",
    date: "2026-01-20",
    summary:
      "Defines the migration path from compliance-fabric v2 to the AIR runtime's " +
      "Compliance Operating System capability. Uses the Strangler Fig pattern " +
      "for gradual migration. Establishes the Evidence IR format as the target " +
      "evidence format and defines a format conversion layer for legacy evidence.",
    implementationNotes:
      "Migration is implemented via ADR-007. The format conversion layer translates " +
      "compliance-fabric v2 evidence to Evidence IR on ingestion. Legacy format " +
      "support is scheduled for removal after the n=200 calibration dataset is " +
      "achieved. All compliance rules have been ported to the AIR rules engine. " +
      "The migration dashboard tracks conversion completeness per rule.",
    relatedAdrs: ["ADR-007"],
  },
];

// ---------------------------------------------------------------------------
// HARD_FAILURES
// ---------------------------------------------------------------------------

export const HARD_FAILURES: readonly HardFailure[] = [
  {
    id: "HF-001",
    title: "TEE Attestation Is a Boolean Config Flag",
    severity: "Critical",
    description:
      "The tee-attestation capability currently uses a boolean configuration flag " +
      "(ATTED_ATTESTED=true) to assert TEE attestation status instead of performing " +
      "actual hardware attestation verification. This means the system claims TEE " +
      "attestation without any hardware evidence, which is a fundamental constitutional " +
      "violation of the TrustBoundaryIntegrity rule.",
    affectedCapabilities: ["tee-attestation"],
    remediation:
      "Replace the boolean config flag with actual hardware attestation verification. " +
      "Integrate with AMD SEV-SNP attestation API to generate and verify real " +
      "attestation reports. Implement PCR measurement verification against known-good " +
      "values. If no TEE hardware is available, disable the capability entirely.",
    blockedBy: [],
    detectedAt: "2025-11-01",
    status: "Open",
    evidence:
      "Config file shows ATTED_ATTESTED=true with no corresponding attestation report " +
      "or PCR measurement in the evidence store. The tee-attestation capability's " +
      "evidence array is empty for the attestationReport field.",
  },
  {
    id: "HF-002",
    title: "Client-Side ZK Proofs Unverified On-Chain",
    severity: "Critical",
    description:
      "ZK proofs generated by the zk-proof-verification capability are verified " +
      "client-side only. The Groth16 verifier contract has not been deployed to " +
      "Polygon Amoy, so proof validity cannot be verified on-chain. This means ZK " +
      "proofs cannot serve as evidence in the governance anchor and rely entirely " +
      "on client honesty.",
    affectedCapabilities: ["zk-proof-verification"],
    remediation:
      "Deploy the Groth16 verifier contract on Polygon Amoy testnet. Configure the " +
      "AIR runtime to submit proof verification results on-chain. Add a fallback " +
      "server-side verification path for clients that cannot perform client-side " +
      "verification.",
    blockedBy: ["HF-003"],
    detectedAt: "2025-11-15",
    status: "Open",
    evidence:
      "No contract deployment transaction found on Polygon Amoy explorer for the " +
      "Groth16 verifier contract. The governance-anchor capability cannot verify " +
      "ZK proofs because the verifier contract address is not configured.",
  },
  {
    id: "HF-003",
    title: "GovernanceAnchor.sol Undeployed",
    severity: "Critical",
    description:
      "The GovernanceAnchor.sol smart contract has not been deployed to the Polygon " +
      "Amoy testnet. All on-chain governance anchoring is inoperative. Capability " +
      "state, constitutional rule hashes, and RFC/ADR decision records cannot be " +
      "anchored on-chain, meaning the AIR runtime operates in offline mode with " +
      "governance state stored only in the local append-only evidence store.",
    affectedCapabilities: ["governance-anchor"],
    remediation:
      "Deploy GovernanceAnchor.sol to Polygon Amoy testnet. Configure the RPC " +
      "endpoint and contract address in the AIR runtime. Establish a re-anchoring " +
      "schedule of every 100 blocks. Verify contract functionality with a test " +
      "anchoring transaction.",
    blockedBy: [],
    detectedAt: "2025-11-01",
    status: "Open",
    evidence:
      "No contract deployment transaction found on Polygon Amoy explorer. The " +
      "governance-anchor capability's contractDeploymentProof field is empty. " +
      "RPC calls to the configured contract address return contract not found.",
  },
  {
    id: "HF-004",
    title: "Poseidon Hash Collision Risk",
    severity: "High",
    description:
      "The AIR runtime uses Poseidon hashing for ZK circuit-friendly hash functions " +
      "in credential verification. The current Poseidon implementation uses default " +
      "round constants that have not been audited for collision resistance in the " +
      "AIR use case. The parameter set (t=3, RF=8, RP=56) may not provide sufficient " +
      "security margin for the hash preimage sizes used in AIR.",
    affectedCapabilities: ["zk-proof-verification", "proofbridge-vc"],
    remediation:
      "Audit the Poseidon parameter set for the specific hash preimage sizes used " +
      "in AIR circuits. Consider using a professionally audited parameter set or " +
      "switching to a hash function with known security guarantees (e.g., MiMC). " +
      "Run collision resistance tests with the actual AIR input distributions.",
    blockedBy: [],
    detectedAt: "2026-01-10",
    status: "Open",
    evidence:
      "The Poseidon hash parameters used in AIR circuits (t=3, RF=8, RP=56) have " +
      "not been independently audited. The Latus cryptanalysis report recommends " +
      "increasing RF for t=3 to 10 or higher. Current implementation uses the " +
      "default parameters from the circom Poseidon library.",
  },
  {
    id: "HF-005",
    title: "Decision Threshold Has No Derivation Trail",
    severity: "High",
    description:
      "Confidence scores and decision thresholds in the AIR runtime are computed " +
      "without a derivation trail. The Bayesian calibration engine produces " +
      "probability estimates but the path from input evidence to final score is " +
      "not recorded. This makes it impossible to audit or challenge governance " +
      "decisions based on these scores.",
    affectedCapabilities: ["bayesian-calibration"],
    remediation:
      "Implement explainable confidence scoring with full derivation trails as " +
      "specified in ADR-006. Record the input evidence, Bayesian prior, likelihood " +
      "function, posterior distribution, and decision threshold selection for each " +
      "score. Store derivation trails in the append-only evidence store.",
    blockedBy: ["HF-001"],
    detectedAt: "2026-01-20",
    status: "Open",
    evidence:
      "The bayesian-calibration capability's output does not include a derivation " +
      "trail field. Confidence scores are computed and returned without recording " +
      "the intermediate steps. The governance-quorum uses these scores for " +
      "decision-making without audit capability.",
  },
];

// ---------------------------------------------------------------------------
// CONSTITUTIONAL DEBT
// ---------------------------------------------------------------------------

export const CONSTITUTIONAL_DEBT: readonly ConstitutionalDebtItem[] = [
  {
    id: "CD-001",
    title: "Compliance Fabric v2 Evidence Format Not Migrated to Evidence IR",
    severity: "Blocker",
    description:
      "The compliance-os capability still accepts and processes compliance-fabric " +
      "v2 evidence format alongside the new Evidence IR format. Legacy evidence " +
      "cannot be verified by the AIR verification pipeline, creating a gap in " +
      "evidence integrity. The format conversion layer is implemented but not " +
      "enforced — legacy evidence is accepted without conversion.",
    introducedAt: "2025-10-01",
    resolvedAt: null,
    relatedHardFailures: [],
    relatedCapabilities: ["compliance-os"],
    remediation:
      "Enforce automatic conversion of legacy evidence to Evidence IR on ingestion. " +
      "Remove the code path that accepts unconverted legacy evidence. Set a hard " +
      "deadline for removing legacy format support. Migrate all historical legacy " +
      "evidence to Evidence IR format.",
    owner: "ProofBridge Core Team",
  },
  {
    id: "CD-002",
    title: "HMAC Domain Separation Not Enforced in Webhook Pipeline",
    severity: "Blocker",
    description:
      "The hmac-webhook capability implements domain-separated HMAC key namespaces " +
      "in the key management service but does not enforce domain separation in the " +
      "webhook ingestion pipeline. The pipeline accepts webhooks signed with any " +
      "valid HMAC key regardless of the source namespace, which means a compromised " +
      "key from one source could forge webhooks from another source.",
    introducedAt: "2025-11-15",
    resolvedAt: null,
    relatedHardFailures: [],
    relatedCapabilities: ["hmac-webhook"],
    remediation:
      "Add domain separation validation to the webhook ingestion pipeline. Each " +
      "incoming webhook must be verified against the HMAC key for its specific " +
      "source namespace. Add source namespace extraction from the webhook metadata " +
      "before signature verification. Update the HMAC verification middleware to " +
      "enforce namespace constraints.",
    owner: "ProofBridge Core Team",
  },
  {
    id: "CD-003",
    title: "Bayesian Calibration Dataset Below n=200 Threshold",
    severity: "Blocker",
    description:
      "The bayesian-calibration capability has a calibration dataset of fewer than " +
      "200 cases, which is below the constitutional minimum threshold specified " +
      "by the BayesianCalibration rule. Risk scores produced in this state are " +
      "effectively prior-only estimates and are not statistically reliable.",
    introducedAt: "2025-12-01",
    resolvedAt: null,
    relatedHardFailures: [],
    relatedCapabilities: ["bayesian-calibration"],
    remediation:
      "Collect historical evidence data to reach the n=200 threshold. Implement " +
      "automated evidence collection from all capabilities. Add monitoring for " +
      "dataset size and alert when the threshold is reached. In the meantime, " +
      "disable automatic prior updating and use a fixed, manually validated prior.",
    owner: "ProofBridge Core Team",
  },
  {
    id: "CD-004",
    title: "Auth Middleware Renamed to proxy.ts (Now Fixed)",
    severity: "Minor",
    description:
      "The authentication middleware was incorrectly named 'auth.ts' and was " +
      "renamed to 'proxy.ts' to better reflect its role as a proxy authentication " +
      "layer. This was a naming inconsistency that has been corrected. The rename " +
      "was completed without breaking changes.",
    introducedAt: "2025-10-15",
    resolvedAt: "2025-11-01",
    relatedHardFailures: [],
    relatedCapabilities: ["proofbridge-vc"],
    remediation:
      "No further action required. The rename has been completed and all references " +
      "have been updated. The old 'auth.ts' file has been removed. This item is " +
      "included in the constitutional debt register for historical record.",
    owner: "ProofBridge Core Team",
  },
];

// ---------------------------------------------------------------------------
// AIR CONFIG
// ---------------------------------------------------------------------------

export const AIR_CONFIG: AIRConfig = {
  version: "3.1.0",
  codename: "Evidence Compiler",
  status: "BLOCKED",
  lastUpdated: "2026-02-01",
  hardFailureCount: 5,
  openBlockerCount: 3,
  capabilityCount: 7,
  ruleCount: 6,
  patternCount: 6,
  adrCount: 7,
  rfcCount: 3,
};

// ─── Compatibility Aliases (used by store.ts) ───────────────────────────────

export interface TelemetryBaseline {
  latency: number;
  availability: number;
  errorRate: number;
  adapterVersion: number;
}

export const DEFAULT_BASELINES: TelemetryBaseline = {
  latency: 200,
  availability: 99.9,
  errorRate: 0.01,
  adapterVersion: 1,
};

export const DEFAULT_CAPABILITIES = CAPABILITIES;
export const DEFAULT_RULES = RULES;

export interface RFCEntry {
  id: string;
  title: string;
  author: string;
  summary: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Promoted';
  createdAt: string;
  updatedAt: string;
  implementationNotes?: string;
  relatedAdrs?: string[];
}

export const DEFAULT_RFC_ENTRIES: RFCEntry[] = RFCS.map(rfc => ({
  id: rfc.id,
  title: rfc.title,
  author: rfc.author,
  summary: rfc.summary,
  status: rfc.status as RFCEntry['status'],
  createdAt: rfc.date,
  updatedAt: rfc.date,
  implementationNotes: rfc.implementationNotes,
  relatedAdrs: rfc.relatedAdrs,
}));
