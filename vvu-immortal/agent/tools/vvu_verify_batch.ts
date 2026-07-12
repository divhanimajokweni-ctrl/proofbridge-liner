import { defineTool } from "eve/tools";
import { z } from "zod";
import { always } from "eve/tools/approval";

export default defineTool({
  description:
    "Verify a batch of evidence leaves through the VVU Colony in one operation. This processes multiple evidence pieces through the trust verification pipeline. Batch verification affects the trust score — always requires approval.",

  inputSchema: z.object({
    leafIds: z
      .array(z.string())
      .min(1)
      .describe("Array of leaf IDs to verify"),
    verifyAll: z
      .boolean()
      .default(false)
      .describe(
        "If true, verify all leaves; if false, verify only pending ones",
      ),
  }),

  // Batch verification is a serious trust operation — always require approval
  approval: always(),

  async execute({ leafIds, verifyAll }, ctx) {
    const response = await fetch("http://localhost:3001/vvu/verify-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leafIds,
        verifyAll,
        sessionId: ctx.session.id,
      }),
    });
    const result = await response.json();

    return {
      total: result.total,
      verified: result.verified,
      rejected: result.rejected,
      trustScore: result.trustScore,
      results: result.results,
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    return {
      type: "text",
      value: `⚖️ Verified ${output.verified}/${output.total} leaves (trust: ${(output.trustScore * 100).toFixed(1)}%)`,
    };
  },
});
