import { NextResponse } from "next/server";

// GET /api/acceptance-engine — Acceptance Engine section data
export async function GET() {
  try {
    const data = {
      pipeline: {
        stages: [
          { name: "Canonicalize", status: "complete", avgMs: 0.3, successCount: 1247, failureCount: 3 },
          { name: "Hash", status: "complete", avgMs: 0.1, successCount: 1247, failureCount: 0 },
          { name: "Schema Verify", status: "complete", avgMs: 0.8, successCount: 1247, failureCount: 12 },
          { name: "Signature Verify", status: "complete", avgMs: 2.1, successCount: 1235, failureCount: 15 },
          { name: "Policy Evaluate", status: "complete", avgMs: 1.4, successCount: 1220, failureCount: 23 },
          { name: "Sequence Assign", status: "active", avgMs: 0.05, successCount: 1220, failureCount: 0 },
          { name: "Persist", status: "pending", avgMs: 3.2, successCount: 1218, failureCount: 2 },
          { name: "Emit Acceptance", status: "pending", avgMs: 0.2, successCount: 1218, failureCount: 0 },
        ],
        totalFacts: 1247,
        acceptedFacts: 1218,
        rejectedFacts: 29,
        throughput: 12.3,
        avgLatencyMs: 8.15,
        rejectionRate: 0.023,
      },
      factLifecycle: {
        states: [
          { name: "Accepted", count: 1218, color: "verified" },
          { name: "Rejected", count: 29, color: "violating" },
          { name: "Superseded", count: 45, color: "repairing" },
          { name: "Expired", count: 12, color: "quarantined" },
          { name: "Compensated", count: 8, color: "repairing" },
        ],
        transitions: [
          { from: "Accepted", to: "Superseded", count: 45 },
          { from: "Accepted", to: "Expired", count: 12 },
          { from: "Superseded", to: "Compensated", count: 8 },
          { from: "Rejected", to: "Compensated", count: 0 },
        ],
      },
      canonicalizer: {
        currentImpl: "RFC8785 JSON",
        futureImpl: "CBOR",
        example: {
          original: '{"name":"transfer","amount":100,"from":"alice","to":"bob"}',
          canonical: '{"amount":100,"from":"alice","name":"transfer","to":"bob"}',
          hash: "sha256:a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4",
        },
      },
      sequencer: {
        currentSequence: 847291,
        vectorClock: { node1: 423, node2: 391, node3: 412 },
        monotonicTime: "2026-01-15T14:32:01.234Z",
      },
      failureFacts: [
        { type: "FactRejected", count: 15, lastOccurrence: "2m ago", severity: "high" },
        { type: "ProofExpired", count: 3, lastOccurrence: "15m ago", severity: "medium" },
        { type: "PolicyViolation", count: 8, lastOccurrence: "5m ago", severity: "high" },
        { type: "DuplicateFact", count: 2, lastOccurrence: "1h ago", severity: "low" },
        { type: "ReplayConflict", count: 1, lastOccurrence: "3h ago", severity: "critical" },
        { type: "ConsensusFailure", count: 0, lastOccurrence: "never", severity: "critical" },
        { type: "ProjectionFailure", count: 4, lastOccurrence: "30m ago", severity: "medium" },
      ],
      metrics: {
        throughputHistory: [11.2, 12.1, 11.8, 12.3, 12.5, 11.9, 12.3, 12.7, 12.3, 11.8, 12.1, 12.3],
        latencyHistory: [8.5, 8.2, 8.8, 8.1, 7.9, 8.3, 8.15, 8.0, 8.2, 8.4, 8.1, 8.15],
        policyEvalTimeHistory: [1.6, 1.5, 1.4, 1.3, 1.4, 1.5, 1.4, 1.3, 1.4, 1.5, 1.4, 1.4],
      },
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to generate acceptance engine data:", error);
    return NextResponse.json(
      { error: "Failed to generate acceptance engine data" },
      { status: 500 },
    );
  }
}
