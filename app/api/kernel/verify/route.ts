import { NextResponse } from "next/server";

// Epistemic Runtime v0.8 — Replay Verification API (mock data)

export async function GET() {
  return NextResponse.json({
    deterministic: true,
    checks: {
      factIdsMatch: true,
      canonicalBytesMatch: true,
      signaturesMatch: true,
      mmrRootsMatch: true,
      rootsMatch: true,
    },
    assertions: [
      { name: "Fact IDs are deterministic", passed: true, category: "identity", details: "UUIDv5 from namespace + canonical bytes produces identical IDs across runs" },
      { name: "Canonical bytes are identical", passed: true, category: "serialization", details: "RFC8785 produces byte-identical output" },
      { name: "Ed25519 signatures are identical", passed: true, category: "signatures", details: "Deterministic key + deterministic message = identical signature" },
      { name: "MMR roots match", passed: true, category: "accumulators", details: "MMR root is deterministic given same leaf set and insertion order" },
      { name: "Projection roots match", passed: true, category: "projections", details: "Projection state hash identical across replays" },
      { name: "Hermetic replay verified", passed: true, category: "replay", details: "No external dependencies accessed during replay" },
    ],
    projectionRoot1: "sha256:proj_state_hash_run1",
    projectionRoot2: "sha256:proj_state_hash_run2",
    verdict: "DETERMINISTIC — replay produces byte-identical output",
  });
}
