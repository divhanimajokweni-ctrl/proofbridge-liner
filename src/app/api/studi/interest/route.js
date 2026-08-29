import { NextResponse } from "next/server";
import {
  classifyInterest,
  generateBridgingPrompt
} from "@/lib/studi/interest-inception-state";
async function POST(request) {
  var _a;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      {
        interest_category: "unknown",
        bridging_prompt: generateBridgingPrompt("unknown", "unknown"),
        suggested_claim_template: null,
        ai_assisted: false,
        provider: null
      },
      { status: 200 }
    );
  }
  const interest = ((_a = body.interest) != null ? _a : "").trim();
  if (!interest) {
    return NextResponse.json(
      {
        interest_category: "unknown",
        bridging_prompt: generateBridgingPrompt("unknown", "unknown"),
        suggested_claim_template: null,
        ai_assisted: false,
        provider: null
      },
      { status: 200 }
    );
  }
  let category = classifyInterest(interest);
  let prompt = generateBridgingPrompt(interest, category);
  let aiAssisted = false;
  let provider = null;
  try {
    const aiResult = await tryAiRefinement(interest, category);
    if (aiResult) {
      category = aiResult.category;
      prompt = aiResult.prompt;
      aiAssisted = true;
      provider = aiResult.provider;
    }
  } catch (e) {
  }
  return NextResponse.json(
    {
      interest_category: category,
      bridging_prompt: prompt,
      suggested_claim_template: suggestClaimTemplate(category),
      ai_assisted: aiAssisted,
      provider
    },
    { status: 200 }
  );
}
async function tryAiRefinement(interest, fallback) {
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
      systemPrompt: `You are an interest-classification assistant for the VVU IVE system. The user has just answered: 'What are you interested in?' Your job is to (1) classify their interest into one of: investing, politics, education, health, technology, sports, business, law, science, philosophy, current_events, personal_finance, relationships, other, unknown \u2014 and (2) generate a bridging prompt that links their interest to epistemic verification. Respond as JSON: {"interest_category": "<one-of-the-15>", "bridging_prompt": "<your prompt>"}. The bridging prompt should start with 'Great. To explore that, let's start by looking at a specific claim you've encountered' and end by asking if they have a message, article, or statement they want to verify.`,
      userMessage: `Interest: "${interest}"

Return JSON only.`,
      temperature: 0.2,
      maxTokens: 300
    });
    if (!result || !result.content) return null;
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.interest_category || !parsed.bridging_prompt) return null;
    const validCategories = [
      "investing",
      "politics",
      "education",
      "health",
      "technology",
      "sports",
      "business",
      "law",
      "science",
      "philosophy",
      "current_events",
      "personal_finance",
      "relationships",
      "other",
      "unknown"
    ];
    if (!validCategories.includes(parsed.interest_category)) {
      parsed.interest_category = fallback;
    }
    return {
      category: parsed.interest_category,
      prompt: String(parsed.bridging_prompt),
      provider: (_a = result.provider) != null ? _a : "unknown"
    };
  } catch (e) {
    return null;
  }
}
function suggestClaimTemplate(category) {
  var _a;
  const templates = {
    investing: "I believe [asset] will [expected outcome] by [timeframe] because [evidence].",
    politics: "[Politician/party] will [action] if [condition] because [evidence].",
    education: "My [grading/curriculum] approach is [consistent/effective] because [evidence].",
    health: "[Treatment/practice] will [health outcome] because [evidence].",
    technology: "[Technology/product] will [impact] because [evidence].",
    sports: "[Team/athlete] will [performance] because [evidence].",
    business: "[Company/strategy] will [business outcome] because [evidence].",
    law: "[Legal position] is [correct/incorrect] because [evidence].",
    science: "[Hypothesis] is [supported/refuted] because [evidence]."
  };
  return (_a = templates[category]) != null ? _a : null;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";