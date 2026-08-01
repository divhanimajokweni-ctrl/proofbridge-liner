/**
 * Gemma AI Judge — advisory-only secondary opinion for the Bayesian safety kernel.
 *
 * Consumed by app/api/verify/route.ts: when the Bayesian posterior lands in the
 * borderline band around the decision threshold, the verify route asks Gemma
 * (via Fireworks) for a secondary opinion. A "FRAUD" verdict lets the route
 * override a Bayesian SAFE into a TRIP. The judge is advisory: with no
 * FIREWORKS_API_KEY it degrades gracefully and never trips on its own.
 */

const FIREWORKS_ENDPOINT =
  "https://api.fireworks.ai/inference/v1/chat/completions";
const GEMMA_MODEL =
  process.env.GEMMA_MODEL ?? "accounts/fireworks/models/gemma-4-26b-a4b-it";
const BORDERLINE_BAND = 0.05;

export interface GemmaJudgeInput {
  agentId: string;
  targetContract?: string;
  valueETH?: number | string;
  chronicleId?: string;
  posterior: number;
  threshold: number;
  gamma: number;
}

export type GemmaVerdict = "FRAUD" | "CLEAR" | "ADVISORY";

export interface GemmaOpinion {
  usedGemma: boolean;
  verdict: GemmaVerdict;
  confidence?: number;
  reasoning?: string;
  modelUsed?: string;
  latencyMs?: number;
  error?: string;
}

/** True when the posterior sits within the borderline band around the threshold. */
export function isBorderline(posterior: number, threshold: number): boolean {
  return Math.abs(posterior - threshold) <= BORDERLINE_BAND;
}

function clampConfidence(value: unknown): number | undefined {
  return typeof value === "number" ? Math.max(0, Math.min(1, value)) : undefined;
}

function normalizeVerdict(raw: unknown): GemmaVerdict {
  const v = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (v === "FRAUD") return "FRAUD";
  if (v === "CLEAR") return "CLEAR";
  return "ADVISORY";
}

export async function gemmaJudge(
  input: GemmaJudgeInput,
): Promise<GemmaOpinion> {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    return {
      usedGemma: false,
      verdict: "ADVISORY",
      error:
        "FIREWORKS_API_KEY not configured; borderline case was NOT reviewed by Gemma.",
    };
  }

  const started = Date.now();
  const prompt = [
    "You are a compliance risk reviewer for South African property-deed registration fraud detection.",
    "You provide an advisory secondary opinion only — you cannot see raw signatures or override cryptographic checks.",
    "",
    "CASE FACTS:",
    `  Agent ID: ${input.agentId}`,
    `  Target contract: ${input.targetContract ?? "n/a"}`,
    `  Value (ETH): ${input.valueETH ?? "n/a"}`,
    `  Chronicle ID: ${input.chronicleId ?? "n/a"}`,
    `  Bayesian posterior: ${input.posterior.toFixed(4)}`,
    `  Decision threshold: ${input.threshold}`,
    `  Cost ratio (gamma): ${input.gamma}`,
    "",
    "TASK: Assess whether this borderline case shows signs of fraud.",
    'Respond with STRICT JSON only (no prose outside the JSON object):',
    '{"verdict": "FRAUD" | "CLEAR", "confidence": 0.0-1.0, "reasoning": "<one paragraph>"}',
  ].join("\n");

  try {
    const response = await fetch(FIREWORKS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        usedGemma: false,
        verdict: "ADVISORY",
        error: `Fireworks API error ${response.status}: ${body.slice(0, 300)}`,
        latencyMs: Date.now() - started,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return {
        usedGemma: false,
        verdict: "ADVISORY",
        error: "Fireworks response had no message content.",
        latencyMs: Date.now() - started,
      };
    }

    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      verdict?: string;
      confidence?: number;
      reasoning?: string;
    };

    return {
      usedGemma: true,
      verdict: normalizeVerdict(parsed.verdict),
      confidence: clampConfidence(parsed.confidence),
      reasoning: parsed.reasoning,
      modelUsed: GEMMA_MODEL,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    return {
      usedGemma: false,
      verdict: "ADVISORY",
      error:
        err instanceof Error
          ? `Fireworks request failed: ${err.message}`
          : "Unknown error calling Fireworks.",
      latencyMs: Date.now() - started,
    };
  }
}
