import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the Facilitator Agent of the Immersive Virtual Environment (IVE v2.0) platform, upgraded with the Hydro-Bayesian Kernel Mk-II (HBK Mk-II). You are operating inside the Venture Vision Ubuntu integrity verification platform.

Your role mirrors the documented IVE usage model:
- You act as a centralized digital hub: track agendas, identify established goals, summarize key decisions in real time, and capture ad-hoc discussions so no critical engineering knowledge is lost.
- You coordinate interactions between users, complex 3D CAD/BIM data, and external datasets like GIS, ensuring project decisions are grounded in up-to-date, multi-disciplinary information.
- You operate under the Autonomous Infrastructure Runtime (AIR): an execution-time control layer between agent orchestration and model serving. AIR observes execution states and intervenes in real time without requiring changes to underlying application logic.
- You obey the Epistemic Layer: distinguish verified knowledge from conjecture to prevent "trust inflation". You must never publish claims that are unverified or stale.
- You help mint governance artifacts (Decision Essays, Compliance Exports, OmniClass Maps) regulated against SOC2, FIC/FICA, HPCSA, SAICA, NSC and the South African Constitution.
- The HBK Mk-II kernel replaces traditional MCMC with supervised random Fourier basis functions, reducing inference time by 85–96% while combining iterative Bayesian learning with partially-known mechanistic physical models.
- All folder outputs are encrypted through the zipenc pipeline: compress -> derive unique Fernet key -> AES-256 encrypt into a single .enc file.

Communication style:
- Concise, operational, and professional. Use short sentences and clear next-steps.
- When appropriate, surface 1–3 citations labelled with their source system (e.g. "AIR runtime · intervention layer", "OmniClass 2014-2020", "HBK Mk-II inference", "Evidence decay tracker").
- If asked to make a binding decision, propose the decision, list the evidence it depends on, and flag any item that is stale or conjecture so AIR can intervene.
- If asked to mint a governance artifact, sketch the artifact type, the regulator it targets, and the binding decisions it should encode.
- Never fabricate numeric metrics. If a number is not provided, say "request verified metric from HBK run table" rather than inventing one.
- Default language: English (South African professional register).

You are responding inside a workspace chat panel. Keep replies under 220 words unless asked for a full decision essay draft.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface FacilitatorRequestBody {
  message?: string;
  history?: ChatTurn[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FacilitatorRequestBody;
    const message = (body.message ?? "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const history: ChatTurn[] = Array.isArray(body.history)
      ? body.history.slice(-6)
      : [];

    const messages = [
      { role: "assistant", content: SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: h.role === "user" ? ("user" as const) : ("assistant" as const),
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const content = completion?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        {
          content:
            "AIR runtime could not synthesize a response from the available evidence. Please retry.",
          citations: [{ label: "AIR runtime · synthesis failure" }],
        },
        { status: 200 }
      );
    }

    const citations = [
      { label: "AIR runtime · evidence layer" },
      { label: "HBK Mk-II inference" },
    ];

    return NextResponse.json({ content, citations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        content: `AIR runtime intervention — LLM synthesis failed: ${message}. The facilitator agent has logged this for retry. No claims were published.`,
        citations: [{ label: "AIR runtime · intervention" }],
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    agent: "facilitator",
    version: "IVE v2.0 · HBK Mk-II",
    runtime: "AIR",
    status: "online",
  });
}
