var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  EVIDENCE_SOURCES,
  queryEvidenceMesh,
  synthesizeEmbedding
} from "@/lib/eis";
async function POST(req) {
  const body = await req.json();
  const {
    claimId,
    source,
    content,
    weight,
    state = "OBSERVED",
    seed = Math.floor(Math.random() * 1e4)
  } = body;
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }
  const claim = await db.claim.findUnique({ where: { id: claimId } });
  if (!claim) {
    return NextResponse.json({ error: "claim not found" }, { status: 404 });
  }
  if (source) {
    if (!EVIDENCE_SOURCES.includes(source)) {
      return NextResponse.json({ error: `invalid source: ${source}` }, { status: 400 });
    }
    const src = source;
    const embedding = synthesizeEmbedding(src, seed);
    const ev = await db.evidence.create({
      data: {
        claimId,
        source: src,
        content: content != null ? content : `Evidence from ${src}`,
        embedding: JSON.stringify(embedding),
        weight: weight != null ? weight : 0.8,
        state
      }
    });
    return NextResponse.json({
      evidence: __spreadProps(__spreadValues({}, ev), { embedding, source: src, state })
    });
  }
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
          state: r.state
        }
      });
      return __spreadProps(__spreadValues({}, ev), { embedding: r.embedding, source: r.source, state: r.state });
    })
  );
  return NextResponse.json({ evidence: created });
}
async function GET(req) {
  const claimId = req.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId query param required" }, { status: 400 });
  }
  const evidence = await db.evidence.findMany({
    where: { claimId },
    orderBy: { collectedAt: "asc" }
  });
  const result = evidence.map((e) => __spreadProps(__spreadValues({}, e), {
    source: e.source,
    state: e.state,
    embedding: JSON.parse(e.embedding)
  }));
  return NextResponse.json({ evidence: result });
}

export const dynamic = "force-dynamic";