import { defineTool } from "eve/tools";
import { z } from "zod";
import { always } from "eve/tools/approval";

const STATES = [
  "IDLE",
  "INGESTING",
  "ATTESTING",
  "VERIFYING",
  "COMMITTING",
  "SETTLED",
  "HAZARD",
] as const;

export default defineTool({
  description:
    "Emit a new runtime event and generate a snapshot. This transitions the VVU Colony to a new kernel state. State transitions affect the trust score — always requires human approval.",

  inputSchema: z.object({
    state: z
      .enum(STATES)
      .describe(
        "The new kernel state to transition to. Must follow the state machine order: IDLE → INGESTING → ATTESTING → VERIFYING → COMMITTING → SETTLED. HAZARD is an emergency state reachable from any state.",
      ),
    reason: z
      .string()
      .optional()
      .describe("Why this transition is happening — context for the approval gate"),
  }),

  // State transitions affect trust — always require approval
  approval: always(),

  async execute({ state, reason }, ctx) {
    // Call the VVU MCP server for state transition
    const response = await fetch("http://localhost:3001/vvu/emit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, reason, sessionId: ctx.session.id }),
    });
    const result = await response.json();

    return {
      state: result.state,
      seq: result.seq,
      trust: result.trust,
      trustClass: result.trust > 0.8 ? "CLASS-A VERIFIED" : "CLASS-B PROVISIONAL",
      message: `Emitted event: ${state}`,
      timestamp: new Date().toISOString(),
    };
  },

  toModelOutput(output) {
    return {
      type: "text",
      value: `✅ Transitioned to ${output.state} (seq ${output.seq}, trust ${(output.trust * 100).toFixed(1)}%)`,
    };
  },
});
