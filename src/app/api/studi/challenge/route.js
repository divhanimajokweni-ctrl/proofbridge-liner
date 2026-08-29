import { NextResponse } from "next/server";
import {
  scanClaim
} from "@/lib/studi/challenge-scanner";
async function POST(request) {
  var _a, _b;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { challenges: [], ai_assisted: false, provider: null },
      { status: 400 }
    );
  }
  const claim = ((_a = body.claim) != null ? _a : "").trim();
  if (!claim) {
    return NextResponse.json(
      { challenges: [], ai_assisted: false, provider: null },
      { status: 400 }
    );
  }
  const evidence = ((_b = body.evidence) != null ? _b : "").trim() || null;
  const localChallenges = scanClaim(claim, evidence);
  let challenges = localChallenges;
  let aiAssisted = false;
  let provider = null;
  try {
    const aiResult = await tryAiScan(claim, evidence);
    if (aiResult) {
      challenges = aiResult.challenges;
      aiAssisted = true;
      provider = aiResult.provider;
    }
  } catch (e) {
  }
  return NextResponse.json(
    {
      challenges,
      ai_assisted: aiAssisted,
      provider
    },
    { status: 200 }
  );
}
async function tryAiScan(claim, evidence) {
  var _a;
  let routeInference;
  try {
    const mod = await import("@/lib/studi/inference-router");
    routeInference = mod.routeInference;
  } catch (e) {
    return null;
  }
  if (typeof routeInference !== "function") return null;
  try {
    const result = await routeInference({
      task: "structured",
      systemPrompt: 'You are an epistemic challenge scanner for the VVU IVE system. You scan a claim + evidence for four triggers: (1) contradiction \u2014 claim asserts certainty that the evidence hedges; (2) unsupported_assumption \u2014 claim treats a premise as established without evidence; (3) alternative_explanation \u2014 claim asserts causation but evidence only establishes correlation; (4) overconfidence \u2014 claim uses certainty language without proportional evidence. Return JSON: {"challenges": [{"type": "<one-of-the-four>", "title": "<short>", "description": "<one sentence>", "claim_excerpt": "<excerpt>", "evidence_excerpt": "<excerpt or null>", "assessment": "<explanation>", "suggested_responses": ["<response 1>", "<response 2>", "<response 3>"], "confidence": <0-1>]}. If no triggers fire, return {"challenges": []}.',
      userMessage: `Claim: "${claim}"

Evidence: ${evidence ? `"${evidence}"` : "(none provided)"}

Return JSON only.`,
      temperature: 0.2,
      maxTokens: 800
    });
    if (!result || !result.content) return null;
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.challenges)) return null;
    const validTypes = [
      "contradiction",
      "unsupported_assumption",
      "alternative_explanation",
      "overconfidence"
    ];
    const cleaned = parsed.challenges.filter((c) => c && validTypes.includes(c.type)).map((c, i) => {
      var _a2, _b, _c, _d;
      return {
        id: `ch-ai-${Date.now()}-${i}`,
        type: c.type,
        title: String((_a2 = c.title) != null ? _a2 : "Challenge"),
        description: String((_b = c.description) != null ? _b : ""),
        claim_excerpt: String((_c = c.claim_excerpt) != null ? _c : ""),
        evidence_excerpt: c.evidence_excerpt ? String(c.evidence_excerpt) : null,
        assessment: String((_d = c.assessment) != null ? _d : ""),
        suggested_responses: Array.isArray(c.suggested_responses) ? c.suggested_responses.map(String) : [],
        confidence: typeof c.confidence === "number" ? Math.max(0, Math.min(1, c.confidence)) : 0.5
      };
    });
    if (cleaned.length === 0) return null;
    return {
      challenges: cleaned,
      provider: (_a = result.provider) != null ? _a : "unknown"
    };
  } catch (e) {
    return null;
  }
}
async function GET() {
  return NextResponse.json(
    {
      epistemic_objects: [],
      storage: "client-localstorage",
      note: "Phase-1: epistemic objects are persisted in the user's browser localStorage (key: vvu-epistemic-objects). Phase-2 will move this to the database.",
      stats: {
        total: 0,
        by_resolution: {},
        by_challenge_type: {}
      }
    },
    { status: 200 }
  );
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";