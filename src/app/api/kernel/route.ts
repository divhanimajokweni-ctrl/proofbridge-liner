import { NextResponse } from "next/server";

// Epistemic Runtime v0.8 — Kernel API (mock data)
// Returns mock kernel verification, runtime status, and contract compliance.

const CONTRACT_DELIVERABLES = [
  { id: 1, name: "Acceptance Pipeline", path: "src/lib/kernel/acceptance-pipeline.ts", status: "IMPLEMENTED" },
  { id: 2, name: "Canonicalizer (RFC8785)", path: "src/lib/kernel/canonicalization.ts", status: "IMPLEMENTED" },
  { id: 3, name: "MMR Engine", path: "src/lib/kernel/mmr.ts", status: "IMPLEMENTED" },
  { id: 4, name: "Replay Engine", path: "src/lib/kernel/replay.ts", status: "IMPLEMENTED" },
  { id: 5, name: "Policy Engine", path: "src/lib/kernel/policy-evaluator.ts", status: "IMPLEMENTED" },
  { id: 6, name: "Projection Engine", path: "src/lib/kernel/projection.ts", status: "IMPLEMENTED" },
  { id: 7, name: "WORM Emulator", path: "src/storage/local-worm.ts", status: "IMPLEMENTED" },
  { id: 8, name: "S3 Object Lock Driver", path: "src/storage/s3-object-lock.ts", status: "INTERFACE_ONLY" },
  { id: 9, name: "KMS Signer Provider", path: "src/signer/aws-kms.ts", status: "INTERFACE_ONLY" },
  { id: 10, name: "Projection Registry", path: "src/lib/kernel/projection-registry.ts", status: "IMPLEMENTED" },
  { id: 11, name: "Operational Collector", path: "src/lib/kernel/operational-collector.ts", status: "IMPLEMENTED" },
  { id: 12, name: "state.sh Client", path: "scripts/state.sh", status: "IMPLEMENTED" },
  { id: 13, name: "Verification Harness", path: "scripts/verify-kernel.ts", status: "IMPLEMENTED" },
  { id: 14, name: "Deterministic Test Suite", path: "src/__tests__/kernel/", status: "IMPLEMENTED" },
  { id: 15, name: "Evidence Envelope", path: "src/lib/evidence/", status: "IMPLEMENTED" },
  { id: 16, name: "Trust Runtime (CQRS)", path: "src/lib/trust-runtime/", status: "IMPLEMENTED" },
  { id: 17, name: "Governance ADRs", path: "docs/governance/adrs/", status: "IMPLEMENTED" },
];

const REQUIRED_VERIFICATIONS = [
  { id: 1, name: "RFC8785 deterministic encoding", status: "VERIFIED" },
  { id: 2, name: "SHA256 deterministic hashing", status: "VERIFIED" },
  { id: 3, name: "Ed25519 signing", status: "VERIFIED" },
  { id: 4, name: "Replay byte identity", status: "VERIFIED" },
  { id: 5, name: "Replay signature identity", status: "VERIFIED" },
  { id: 6, name: "Replay MMR identity", status: "VERIFIED" },
  { id: 7, name: "Projection identity", status: "VERIFIED" },
  { id: 8, name: "WORM mutation rejection", status: "VERIFIED" },
  { id: 9, name: "Policy determinism", status: "VERIFIED" },
  { id: 10, name: "Schema validation", status: "VERIFIED" },
  { id: 11, name: "PII redaction", status: "VERIFIED" },
  { id: 12, name: "Hermetic replay", status: "VERIFIED" },
];

export async function GET() {
  return NextResponse.json({
    version: "v0.8",
    contractVersion: "0.8 Baseline",
    status: "VERIFIED",
    verification: {
      passed: 12,
      total: 12,
      assertions: REQUIRED_VERIFICATIONS.map((v) => ({
        name: v.name,
        passed: true,
        category: "kernel",
        details: `Assertion: ${v.name} — ${v.status}`,
      })),
    },
    runtime: {
      mmrRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb924",
      currentSequence: 847291,
      factCount: 1247,
      projectionCount: 3,
      registeredProjections: [
        { name: "state-summary", version: 1, deprecated: false },
        { name: "replay-test", version: 1, deprecated: false },
      ],
    },
    facts: [
      { id: "fact-001", type: "observation", sequence: 847281, hash: "sha256:a1b2c3d4", signature: "ed25519:abc123..." },
      { id: "fact-002", type: "migration_plan", sequence: 847282, hash: "sha256:e5f6a7b8", signature: "ed25519:def456..." },
      { id: "fact-003", type: "migration_execute", sequence: 847283, hash: "sha256:i9j0k1l2", signature: "ed25519:ghi789..." },
    ].slice(-10),
    projections: [
      { name: "state-summary", version: 1, stateHash: "sha256:proj1hash", factRoot: "sha256:e3b0c44298fc", deprecated: false },
      { name: "replay-test", version: 1, stateHash: "sha256:proj2hash", factRoot: "sha256:e3b0c44298fc", deprecated: false },
    ],
    primitives: {
      fact: "IMPLEMENTED",
      proof: "IMPLEMENTED",
      policy: "IMPLEMENTED",
      projection: "IMPLEMENTED",
    },
    deliverables: CONTRACT_DELIVERABLES,
    requiredVerifications: REQUIRED_VERIFICATIONS,
    contract: {
      architecturalRules: [
        { id: 1, text: "Exactly one ingestion path", status: "COMPLIANT" },
        { id: 2, text: "Facts are immutable", status: "COMPLIANT" },
        { id: 3, text: "State is always projected", status: "COMPLIANT" },
        { id: 4, text: "Bit-for-bit reproducibility", status: "COMPLIANT" },
        { id: 5, text: "No nondeterminism in kernel", status: "COMPLIANT" },
        { id: 6, text: "Evidence is append-only", status: "COMPLIANT" },
        { id: 7, text: "PII redaction before canonicalization", status: "COMPLIANT" },
      ],
      designPhilosophy: {
        deterministic: true,
        replayable: true,
        cryptographicallyVerifiable: true,
        vendorNeutral: true,
        hermetic: true,
        appendOnly: true,
      },
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, factBody } = body;

  if (!type || !factBody) {
    return NextResponse.json(
      { error: "Missing required fields: type, factBody" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    accepted: true,
    fact: {
      id: `fact-${Date.now().toString(36)}`,
      type,
      sequence: 847292,
      hash: `sha256:${Date.now().toString(16)}`,
      timestamp: Date.now(),
    },
    errors: [],
  });
}
