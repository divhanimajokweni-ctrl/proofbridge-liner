import { defineTool } from "eve/tools";
import { z } from "zod";
import { never } from "eve/tools/approval";

export default defineTool({
  description:
    "Get a complete snapshot of the VVU Colony canopy, including the trust score, trust class, total/verified/rejected leaves, current season, and leaf details. This is the primary way to inspect colony health.",

  inputSchema: z.object({
    includeLeaves: z
      .boolean()
      .default(true)
      .describe("Whether to include all leaf details in the response"),
    limit: z
      .number()
      .default(50)
      .describe("Maximum number of leaves to return"),
  }),

  // Reading is safe — no approval needed
  approval: never(),

  async execute({ includeLeaves, limit }, ctx) {
    const response = await fetch("http://localhost:3001/vvu/canopy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        includeLeaves,
        limit,
        sessionId: ctx.session.id,
      }),
    });
    const result = await response.json();

    return {
      trustScore: result.trustScore,
      trustClass: result.trustClass,
      totalLeaves: result.totalLeaves,
      verifiedLeaves: result.verifiedLeaves,
      rejectedLeaves: result.rejectedLeaves,
      season: result.season,
      leaves: result.leaves || [],
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    return {
      type: "text",
      value: `🌳 Canopy: ${output.verifiedLeaves}/${output.totalLeaves} verified (trust: ${(output.trustScore * 100).toFixed(1)}%, season: ${output.season})`,
    };
  },
});
