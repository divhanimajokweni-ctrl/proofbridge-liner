import { defineTool } from "eve/tools";
import { z } from "zod";
import { once } from "eve/tools/approval";

export default defineTool({
  description:
    "Add a new piece of evidence (leaf) to the VVU Colony canopy. Each leaf represents a claim or fact being verified. Requires approval once per session.",

  inputSchema: z.object({
    claim: z.string().min(1).describe("The claim or fact being added to the colony"),
    source: z.string().min(1).describe("The source URL or reference for this evidence"),
    confidence: z
      .enum(["low", "medium", "high"])
      .default("medium")
      .describe("Confidence level of the evidence"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags for categorizing the evidence"),
  }),

  // Once per session approval — trust the agent after first verification
  approval: once(),

  async execute({ claim, source, confidence, tags }, ctx) {
    const response = await fetch("http://localhost:3001/vvu/leaf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claim,
        source,
        confidence,
        tags,
        sessionId: ctx.session.id,
      }),
    });
    const result = await response.json();

    return {
      id: result.id,
      claim,
      source,
      confidence,
      verified: result.verified || false,
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    const status = output.verified ? "✅ verified" : "⏳ pending";
    return {
      type: "text",
      value: `📝 Added evidence: "${output.claim.slice(0, 60)}..." (${status})`,
    };
  },
});
