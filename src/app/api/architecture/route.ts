import { NextResponse } from "next/server";

// GET /api/architecture — Architecture section data
export async function GET() {
  try {
    const data = {
      primitives: [
        {
          name: "Fact",
          definition: "What happened",
          properties: ["Immutable", "Content-addressed", "Schema-validated"],
          relationships: ["justified by Proof", "governed by Policy", "consumed by Projection"],
        },
        {
          name: "Proof",
          definition: "Why we believe it",
          properties: ["Cryptographic", "Composable", "Verifiable"],
          relationships: ["justifies Fact", "derived by Verifier", "aggregates proofs"],
        },
        {
          name: "Policy",
          definition: "Whether it should be accepted",
          properties: ["Declarative", "Time-bounded", "Emits correction facts"],
          relationships: ["governs Fact acceptance", "versioned independently", "evaluated at fact time"],
        },
        {
          name: "Projection",
          definition: "How humans consume it",
          properties: ["Derived", "Versioned", "Replayable"],
          relationships: ["consumes Facts", "produces State(t)", "versioned with schema"],
        },
      ],
      insights: [
        {
          title: "Orthogonal Primitives",
          description: "Nothing overlaps. Each primitive owns one responsibility.",
          assessment: "Excellent",
        },
        {
          title: "Derived State",
          description: "State(t) = Projection(...), not State += mutation. Simplifies replay, debugging, rollback, audit, simulation.",
          assessment: "Excellent",
        },
        {
          title: "Policies Emit Facts",
          description: "Policy → Correction Fact → Projection. Everything becomes observable. Nothing disappears.",
          assessment: "Excellent",
        },
        {
          title: "Derived Identity",
          description: "Proof → Verifier → Public Key → Identity. Removes unnecessary abstraction.",
          assessment: "Excellent",
        },
      ],
      gaps: [
        { id: 1, name: "Acceptance Pipeline", description: "Deterministic acceptance lifecycle from incoming fact to persistence", status: "in_progress", priority: "critical", impact: "Without it two nodes may disagree on accepted facts" },
        { id: 2, name: "Fact Status/Lifecycle", description: "Accepted, Rejected, Superseded, Expired, Compensated as projections over metadata", status: "in_progress", priority: "high", impact: "Lifecycle changes without mutations" },
        { id: 3, name: "Deterministic Ordering", description: "Order = LogicalSequence → Timestamp → FactID", status: "in_progress", priority: "high", impact: "Replay across nodes may diverge" },
        { id: 4, name: "Canonical Serialization", description: "Canonicalizer interface (serialize, deserialize, hash) for future CBOR support", status: "planned", priority: "high", impact: "Serialization coupling prevents format migration" },
        { id: 5, name: "Projection Versioning", description: "Projection name, version, schema, inputs, outputs", status: "planned", priority: "high", impact: "Replaying 2026 facts with 2032 projection logic changes history" },
        { id: 6, name: "Policy Time Travel", description: "Evaluation must use Policy effectiveAt = Fact.acceptedAt, never current policy", status: "planned", priority: "critical", impact: "Historical replay becomes impossible" },
        { id: 7, name: "Proof Aggregation", description: "Verification as a graph rather than a list — some proofs justify others", status: "planned", priority: "medium", impact: "Proof dependencies are lost" },
        { id: 8, name: "Snapshot Semantics", description: "Snapshots as facts: SnapshotCreated → SnapshotVerified → SnapshotExpired", status: "planned", priority: "medium", impact: "Snapshot lineage disappears" },
        { id: 9, name: "Distributed Consensus", description: "ConsensusAdapter interface (Raft, BFT, Single node) — kernel never knows which", status: "planned", priority: "medium", impact: "Consensus coupling limits deployment" },
        { id: 10, name: "Failure Facts", description: "Errors as evidence: FactRejected, ProofExpired, PolicyViolation, etc.", status: "planned", priority: "high", impact: "Failures disappear without trace" },
      ],
      stability: {
        kernel: ["Fact", "Proof", "Policy", "Projection"],
        replaceable: [
          { current: "SHA-256", future: "BLAKE3", category: "Hash" },
          { current: "Ed25519", future: "Post-quantum signatures", category: "Signatures" },
          { current: "MMR", future: "Verkle", category: "Accumulator" },
          { current: "Kubernetes", future: "Nomad", category: "Orchestration" },
          { current: "Git", future: "Perforce", category: "VCS" },
          { current: "Argo", future: "Flux", category: "CD" },
        ],
      },
      assessment: [
        { area: "Conceptual model", score: 95, grade: "Excellent" },
        { area: "Separation of concerns", score: 95, grade: "Excellent" },
        { area: "Event sourcing", score: 95, grade: "Excellent" },
        { area: "Replayability", score: 95, grade: "Excellent" },
        { area: "Cryptographic model", score: 80, grade: "Good" },
        { area: "Distributed systems", score: 40, grade: "Incomplete" },
        { area: "Version evolution", score: 35, grade: "Incomplete" },
        { area: "Storage model", score: 40, grade: "Incomplete" },
        { area: "Concurrency", score: 10, grade: "Missing" },
        { area: "Production readiness", score: 82, grade: "~80-85%" },
      ],
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to generate architecture data:", error);
    return NextResponse.json(
      { error: "Failed to generate architecture data" },
      { status: 500 },
    );
  }
}
