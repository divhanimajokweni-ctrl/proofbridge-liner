/**
 * IVE API — Evidence
 *
 * POST /api/evidence
 *   Body: { claimId, source?, content?, weight?, state? }
 *
 * If no source is provided, queries the Evidence Mesh for all four sources
 * and ingests them. Otherwise ingests a single evidence item.
 *
 * Backend: EIS evidence-mesh.ts (synthesizes provenance embeddings).
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  EvidenceSource,
  EVIDENCE_SOURCES,
  VerificationState,
  queryEvidenceMesh,
  synthesizeEmbedding,
} from "@/lib/eis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    claimId,
    source,
    content,
    weight,
    state = "OBSERVED",
    seed = Math.floor(Math.random() * 10000),
  } = body;

  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }

  const claim = await db.claim.findUnique({ where: { id: claimId } });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }

  // If source is provided, ingest a single evidence item.
  // Otherwise, run a full Mesh query (all four sources).
  if (source) {
    if (!EVIDENCE_SOURCES.includes(source as EvidenceSource)) {
      return NextResponse.json({ error: `invalid source: ${source}` }, { status: 400 });
    }
    const src = source as EvidenceSource;
    const embedding = synthesizeEmbedding(src, seed);
    const ev = await db.evidence.create({
      data: {
        claimId,
        source: src,
        content: content ?? `Evidence from ${src}`,
        embedding: JSON.stringify(embedding),
        weight: weight ?? 0.8,
        state: state as VerificationState,
      },
    });
    return NextResponse.json({
      evidence: { ...ev, embedding, source: src, state: state as VerificationState },
    });
  }

  // Full Mesh query — synthesize evidence from all four sources
  const meshResults = queryEvidenceMesh(
    { claimId, query: claim.title },
    seed
  );

  const created = await Promise.all(
    meshResults.map(async (r) => {
      const ev = await db.evidence.create({
        data: {
          claimId,
          source: r.source,
          content: r.content,
          embedding: JSON.stringify(r.embedding),
          weight: r.weight,
          state: r.state as VerificationState,
        },
      });
      return { ...ev, embedding: r.embedding, source: r.source, state: r.state as VerificationState };
    })
  );

  return NextResponse.json({ evidence: created });
}

export async function GET(req: NextRequest) {
  const claimId = req.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId query param required" }, { status: 400 });
  }
  const evidence = await db.evidence.findMany({
    where: { claimId },
    orderBy: { collectedAt: "asc" },
  });
  const result = evidence.map((e) => ({
    ...e,
    source: e.source as EvidenceSource,
    state: e.state as VerificationState,
    embedding: JSON.parse(e.embedding) as number[],
  }));
  return NextResponse.json({ evidence: result });
}
