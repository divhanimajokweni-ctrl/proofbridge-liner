import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "v0.8",
    concepts: [
      { id: 1, name: "Observation Versioning", status: "implemented", description: "schemaId + schemaVersion + producer + producerVersion. Makes replay possible years later.", icon: "Layers" },
      { id: 2, name: "Capability Sets", status: "implemented", description: "Vendor-neutral authorization. automation.review, automation.fix, automation.deploy, etc. ER is vendor-neutral.", icon: "Shield" },
      { id: 3, name: "Correlation Graph", status: "implemented", description: "causationId + correlationId + parentFactId. Bot Command → Review → Fix → PR → Merge → Deploy becomes traceable.", icon: "Network" },
      { id: 4, name: "Confidence ≠ Evidence", status: "enforced", description: "Trust scores are projections, NOT facts. Store \"Review Passed\" not \"Trust = 0.94\". Confidence is derived.", icon: "Scale" },
      { id: 5, name: "Typed Observation SDK", status: "implemented", description: "emitBotCommand(), emitReviewStarted(), emitFixCreated() instead of emitObservation(any). Prevents schema drift.", icon: "Code" },
      { id: 6, name: "Observation Authentication", status: "implemented", description: "mTLS / OIDC / IAM-Role / API-Key — never trust source claims", icon: "KeyRound" },
      { id: 7, name: "Projection Manifest", status: "implemented", description: "id, version, dependencies, capabilitySet, projectionHash, deterministic, owner", icon: "ClipboardCheck" },
      { id: 8, name: "Replay Certificates", status: "implemented", description: "First-class evidence of deterministic replay verification", icon: "BadgeCheck" },
      { id: 9, name: "Automation Provenance", status: "implemented", description: "Prompt Hash → Tool Call Hashes → Output Hash → Human Approval", icon: "Eye" },
      { id: 10, name: "Drift Facts", status: "implemented", description: "OperationalDriftObserved: Projection ≠ Live System → evidence", icon: "AlertTriangle" },
    ],
    capabilities: [
      "automation.review", "automation.fix", "automation.deploy", "automation.triage",
      "security.analysis", "security.deep-analysis", "vision.debug", "webhook.ingest", "app.build"
    ],
    adapters: [
      { sourceSystem: "kilo-bot", capabilities: ["automation.review"] },
      { sourceSystem: "code-review", capabilities: ["automation.review"] },
      { sourceSystem: "auto-fix", capabilities: ["automation.fix"] },
      { sourceSystem: "security-agent", capabilities: ["security.analysis", "security.deep-analysis"] },
      { sourceSystem: "github-actions", capabilities: ["automation.deploy"] },
    ],
    correlationChain: [
      { fact: "bot_command", causationId: null, correlationId: "workflow-123" },
      { fact: "code_review", causationId: "bot_command-456", correlationId: "workflow-123", parentFactId: "fact-bot-001" },
      { fact: "auto_fix", causationId: "code_review-789", correlationId: "workflow-123", parentFactId: "fact-review-002" },
      { fact: "merge", causationId: "auto_fix-012", correlationId: "workflow-123", parentFactId: "fact-fix-003" },
      { fact: "deploy", causationId: "merge-345", correlationId: "workflow-123", parentFactId: "fact-merge-004" },
    ],
    replayCertificate: {
      projection: "operationalState",
      projectionHash: "sha256:a3f2b8c9d1e4...",
      factCount: 1200,
      factRoot: "mmr_root_hash_8f3a2b1c",
      runtimeVersion: "v0.8",
      policyVersion: "1.0",
      passed: true,
      timestamp: 1710000000,
      signature: "replay-cert:sha256:a3f2b8c9...",
    },
    provenanceFlow: {
      agent: "AutoFixService",
      promptHash: "sha256:7f8a9b2c...",
      toolCallHashes: ["sha256:tool1-a1b2", "sha256:tool2-c3d4"],
      outputHash: "sha256:e5f6g7h8...",
      humanApproved: false,
      result: "fix-accepted",
    },
  });
}
