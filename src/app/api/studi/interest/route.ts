/**
 * POST /api/studi/interest
 *
 * Parses the user's free-text interest and returns:
 *   - interest_category: the classified category (15 + "unknown")
 *   - bridging_prompt: the contextual prompt linking the interest to IVE
 *   - suggested_claim_template: optional scaffolding for the user's first claim
 *
 * The local heuristic classifier is always run first. If the AI router is
 * configured (GLM-5.1 / OpenAI / etc.), it can refine the classification
 * and generate a richer bridging prompt. The AI router is OPTIONAL — the
 * local heuristic is the always-available fallback per Charter Article
 * XIII §13.3 (extracted state is UI affordance only — NOT epistemic
 * verification).
 *
 * Per operator directive: "IVE parses their interest. It generates a
 * contextual prompt that bridges to verification."
 *
 * Locked as part of the Curiosity-First UX invariant (Charter Article XII §12.4).
 */

import { NextResponse } from "next/server";
import {
  classifyInterest,
  generateBridgingPrompt,
  type InterestCategory,
} from "@/lib/studi/interest-inception-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  interest: string;
}

interface ResponseBody {
  interest_category: InterestCategory;
  bridging_prompt: string;
  suggested_claim_template: string | null;
  ai_assisted: boolean;
  provider: string | null;
}

export async function POST(request: Request): Promise<NextResponse<ResponseBody>> {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        interest_category: "unknown" as InterestCategory,
        bridging_prompt: generateBridgingPrompt("unknown", "unknown"),
        suggested_claim_template: null,
        ai_assisted: false,
        provider: null,
      } satisfies ResponseBody,
      { status: 200 },
    );
  }

  const interest = (body.interest ?? "").trim();
  if (!interest) {
    return NextResponse.json(
      {
        interest_category: "unknown" as InterestCategory,
        bridging_prompt: generateBridgingPrompt("unknown", "unknown"),
        suggested_claim_template: null,
        ai_assisted: false,
        provider: null,
      } satisfies ResponseBody,
      { status: 200 },
    );
  }

  // Step 1: local heuristic classification (always available).
  let category = classifyInterest(interest);
  let prompt = generateBridgingPrompt(interest, category);
  let aiAssisted = false;
  let provider: string | null = null;

  // Step 2: try AI router for richer classification + prompt.
  // The router lives in the inference-router module (if it exists in this
  // build). If not, the local heuristic stands.
  try {
    const aiResult = await tryAiRefinement(interest, category);
    if (aiResult) {
      category = aiResult.category;
      prompt = aiResult.prompt;
      aiAssisted = true;
      provider = aiResult.provider;
    }
  } catch {
    // AI router unavailable — local heuristic stands.
  }

  return NextResponse.json(
    {
      interest_category: category,
      bridging_prompt: prompt,
      suggested_claim_template: suggestClaimTemplate(category),
      ai_assisted: aiAssisted,
      provider,
    } satisfies ResponseBody,
    { status: 200 },
  );
}

// ─── AI refinement (optional) ──────────────────────────────────────────────

async function tryAiRefinement(
  interest: string,
  fallback: InterestCategory,
): Promise<{ category: InterestCategory; prompt: string; provider: string } | null> {
  // Dynamic import — the inference router may not exist in this build.
  // If the import fails, return null (local heuristic stands).
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
        "You are an interest-classification assistant for the VVU IVE system. The user has just answered: 'What are you interested in?' Your job is to (1) classify their interest into one of: investing, politics, education, health, technology, sports, business, law, science, philosophy, current_events, personal_finance, relationships, other, unknown — and (2) generate a bridging prompt that links their interest to epistemic verification. Respond as JSON: {\"interest_category\": \"<one-of-the-15>\", \"bridging_prompt\": \"<your prompt>\"}. The bridging prompt should start with 'Great. To explore that, let's start by looking at a specific claim you've encountered' and end by asking if they have a message, article, or statement they want to verify.",
      userMessage: `Interest: "${interest}"\n\nReturn JSON only.`,
      temperature: 0.2,
      maxTokens: 300,
    });

    if (!result || !result.content) return null;

    // Parse JSON from the response (with fallback to local heuristic).
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.interest_category || !parsed.bridging_prompt) return null;

    const validCategories: InterestCategory[] = [
      "investing", "politics", "education", "health", "technology",
      "sports", "business", "law", "science", "philosophy",
      "current_events", "personal_finance", "relationships", "other", "unknown",
    ];
    if (!validCategories.includes(parsed.interest_category)) {
      parsed.interest_category = fallback;
    }

    return {
      category: parsed.interest_category as InterestCategory,
      prompt: String(parsed.bridging_prompt),
      provider: result.provider ?? "unknown",
    };
  } catch {
    return null;
  }
}

function suggestClaimTemplate(category: InterestCategory): string | null {
  const templates: Partial<Record<InterestCategory, string>> = {
    investing: "I believe [asset] will [expected outcome] by [timeframe] because [evidence].",
    politics: "[Politician/party] will [action] if [condition] because [evidence].",
    education: "My [grading/curriculum] approach is [consistent/effective] because [evidence].",
    health: "[Treatment/practice] will [health outcome] because [evidence].",
    technology: "[Technology/product] will [impact] because [evidence].",
    sports: "[Team/athlete] will [performance] because [evidence].",
    business: "[Company/strategy] will [business outcome] because [evidence].",
    law: "[Legal position] is [correct/incorrect] because [evidence].",
    science: "[Hypothesis] is [supported/refuted] because [evidence].",
  };
  return templates[category] ?? null;
}
