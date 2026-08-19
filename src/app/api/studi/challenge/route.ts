/**
 * POST /api/studi/challenge
 *   Receives { claim, evidence } and returns { challenges: Challenge[] }
 *   scanned by the AI router (if configured) with fallback to the local
 *   heuristic scanner.
 *
 * GET /api/studi/challenge
 *   Returns the user's stored epistemic objects (boundary dataset).
 *   Phase-1: in-memory per session. Phase-2: backed by the database.
 *
 * Per operator directive: "When a user submits a claim, IVE doesn't
 * immediately verify. It first performs a disagreement scan."
 *
 * Locked as part of the Challenge Mode UX invariant (Charter Article XII §12.4).
 */

import { NextResponse } from "next/server";
import {
  scanClaim,
  type Challenge,
} from "@/lib/studi/challenge-scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ScanRequestBody {
  claim: string;
  evidence: string | null;
}

interface ScanResponseBody {
  challenges: Challenge[];
  ai_assisted: boolean;
  provider: string | null;
}

export async function POST(request: Request): Promise<NextResponse<ScanResponseBody>> {
  let body: ScanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { challenges: [], ai_assisted: false, provider: null } satisfies ScanResponseBody,
      { status: 400 },
    );
  }

  const claim = (body.claim ?? "").trim();
  if (!claim) {
    return NextResponse.json(
      { challenges: [], ai_assisted: false, provider: null } satisfies ScanResponseBody,
      { status: 400 },
    );
  }
  const evidence = (body.evidence ?? "").trim() || null;

  // Step 1: local heuristic scan (always available).
  const localChallenges = scanClaim(claim, evidence);
  let challenges = localChallenges;
  let aiAssisted = false;
  let provider: string | null = null;

  // Step 2: try AI router for refined scan.
  try {
    const aiResult = await tryAiScan(claim, evidence);
    if (aiResult) {
      challenges = aiResult.challenges;
      aiAssisted = true;
      provider = aiResult.provider;
    }
  } catch {
    // AI router unavailable — local heuristic stands.
  }

  return NextResponse.json(
    {
      challenges,
      ai_assisted: aiAssisted,
      provider,
    } satisfies ScanResponseBody,
    { status: 200 },
  );
}

// ─── AI scan refinement (optional) ──────────────────────────────────────────

async function tryAiScan(
  claim: string,
  evidence: string | null,
): Promise<{ challenges: Challenge[]; provider: string } | null> {
  let routeInference: any;
  try {
    const mod = await import("@/lib/studi/inference-router");
    routeInference = mod.routeInference;
  } catch {
    return null;
  }
  if (typeof routeInference !== "function") return null;

  try {
    const result = await routeInference({
      task: "structured",
      systemPrompt:
        "You are an epistemic challenge scanner for the VVU IVE system. You scan a claim + evidence for four triggers: (1) contradiction — claim asserts certainty that the evidence hedges; (2) unsupported_assumption — claim treats a premise as established without evidence; (3) alternative_explanation — claim asserts causation but evidence only establishes correlation; (4) overconfidence — claim uses certainty language without proportional evidence. Return JSON: {\"challenges\": [{\"type\": \"<one-of-the-four>\", \"title\": \"<short>\", \"description\": \"<one sentence>\", \"claim_excerpt\": \"<excerpt>\", \"evidence_excerpt\": \"<excerpt or null>\", \"assessment\": \"<explanation>\", \"suggested_responses\": [\"<response 1>\", \"<response 2>\", \"<response 3>\"], \"confidence\": <0-1>]}. If no triggers fire, return {\"challenges\": []}.",
      userMessage:
        `Claim: "${claim}"\n\nEvidence: ${evidence ? `"${evidence}"` : "(none provided)"}\n\nReturn JSON only.`,
      temperature: 0.2,
      maxTokens: 800,
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
      "overconfidence",
    ];
    const cleaned: Challenge[] = parsed.challenges
      .filter((c: any) => c && validTypes.includes(c.type))
      .map((c: any, i: number) => ({
        id: `ch-ai-${Date.now()}-${i}`,
        type: c.type,
        title: String(c.title ?? "Challenge"),
        description: String(c.description ?? ""),
        claim_excerpt: String(c.claim_excerpt ?? ""),
        evidence_excerpt: c.evidence_excerpt ? String(c.evidence_excerpt) : null,
        assessment: String(c.assessment ?? ""),
        suggested_responses: Array.isArray(c.suggested_responses)
          ? c.suggested_responses.map(String)
          : [],
        confidence: typeof c.confidence === "number"
          ? Math.max(0, Math.min(1, c.confidence))
          : 0.5,
      }));

    if (cleaned.length === 0) return null;

    return {
      challenges: cleaned,
      provider: result.provider ?? "unknown",
    };
  } catch {
    return null;
  }
}

// ─── GET: list stored epistemic objects ─────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  // Phase-1: epistemic objects live in localStorage (client-side).
  // The server has no persistent store yet. Return an empty list with a
  // note that the boundary dataset is currently client-side only.
  return NextResponse.json(
    {
      epistemic_objects: [],
      storage: "client-localstorage",
      note:
        "Phase-1: epistemic objects are persisted in the user's browser localStorage (key: vvu-epistemic-objects). Phase-2 will move this to the database.",
      stats: {
        total: 0,
        by_resolution: {},
        by_challenge_type: {},
      },
    },
    { status: 200 },
  );
}
