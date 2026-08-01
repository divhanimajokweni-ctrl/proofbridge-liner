import { defineAgent } from "eve";

export default defineAgent({
  model: "anthropic/claude-sonnet-5",

  // Reasoning effort for complex verification tasks
  reasoning: {
    effort: "high",
  },

  // Compaction for long-running immortal sessions
  compaction: {
    threshold: 0.8,
    summaryModel: "anthropic/claude-sonnet-5",
  },

  // Subagent limits for the E2E pipeline
  limits: {
    maxSubagentDepth: 3,
    maxSubagents: 50,
  },
});
