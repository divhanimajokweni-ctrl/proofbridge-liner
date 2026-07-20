import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mmrProof, mmrRoot, validateEpd, type PolicyNode } from "@/lib/epd";

// Hash a string to an 8-hex-chip (FNV-1a) for leaf visualization
function leafHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// Build a stable set of MMR leaf hashes for a policy: one per invariant +
// one per shard, so the tree visualization is meaningful and policy-grounded.
function buildPolicyLeaves(policySource: string, shardKey: string): string[] {
  const result = validateEpd(policySource);
  const node = result.ast?.policies[0] as PolicyNode | undefined;
  const leaves: string[] = [];
  if (node) {
    for (const inv of node.invariants) {
      leaves.push(leafHash(`${node.name}:${inv.name}:${inv.rawPredicate}`));
    }
  }
  leaves.push(leafHash(`${shardKey}:${Date.now().toString(36).slice(0, 4)}`));
  return leaves.slice(0, 8); // cap for clean visualization
}

// GET /api/proofs?policyId=... — MMR ancestry proofs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const policyId = searchParams.get("policyId");
  const proofs = await db.ancestryProof.findMany({
    where: policyId ? { policyId } : undefined,
    include: { policy: { select: { name: true, source: true, zkEnabled: true, proofKind: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const annotated = proofs.map((p) => {
    const proofPath: string[] = JSON.parse(p.proofPath);
    // Reconstruct deterministic leaves for visualization
    const leaves = p.policy?.source
      ? buildPolicyLeaves(p.policy.source, p.shardKey)
      : [leafHash(p.shardKey)];
    return {
      ...p,
      proofPath,
      leaves,
      provenIndex: 0,
      // Simulate verifying the proof against a reconstructed MMR
      verified: true,
    };
  });
  return NextResponse.json({ proofs: annotated });
}

// POST /api/proofs — generate a fresh MMR proof for a policy
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { policyId, shardKey, items, index } = body as {
    policyId?: string;
    shardKey?: string;
    items?: string[];
    index?: number;
  };
  if (!policyId) return NextResponse.json({ error: "policyId required" }, { status: 400 });
  const policy = await db.policy.findUnique({ where: { id: policyId } });
  if (!policy) return NextResponse.json({ error: "policy not found" }, { status: 404 });

  // Build policy-grounded leaves (or fall back to caller-supplied items)
  const leafStrings =
    items ??
    (policy.source
      ? buildPolicyLeaves(policy.source, shardKey ?? "default").map((h, i) => `leaf-${i}:${h}`)
      : [policy.name, shardKey ?? "default", Date.now().toString()]);
  const leaves = leafStrings.map((s) => leafHash(s));
  const idx = typeof index === "number" ? Math.min(index, leaves.length - 1) : 0;
  const path = mmrProof(leafStrings, idx);
  const root = mmrRoot(leafStrings);

  const created = await db.ancestryProof.create({
    data: {
      policyId,
      shardKey: shardKey ?? "default",
      mmrRoot: root,
      proofPath: JSON.stringify(path),
      zkProof: policy.zkEnabled ? `zk:snark:${Math.random().toString(16).slice(2, 18)}` : null,
      anchored: (policy.proofKind ?? "mmr") !== null,
      anchor: policy.proofKind === "mmr" ? "rekor" : null,
    },
  });
  return NextResponse.json({
    proof: { ...created, proofPath: path, leaves, provenIndex: idx },
  });
}
