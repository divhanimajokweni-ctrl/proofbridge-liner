export interface AnomalyExplanation {
  summary: string;
  root_cause: string;
  impact: string;
  recommended_action: string;
}

export class AnomalyExplainer {
  generate(status: string, reason: string): AnomalyExplanation {
    if (status === "HALTED") {
      const reasonLower = reason.toLowerCase();
      
      if (reasonLower.includes("overflow")) {
        return {
          summary: "Transaction blocked due to compliance violation.",
          root_cause: "Transaction amount exceeds regulatory threshold for category.",
          impact: "Potential unauthorized capital outflow.",
          recommended_action: "Review amount and supporting documentation."
        };
      } else if (reasonLower.includes("category")) {
        return {
          summary: "Transaction blocked due to compliance violation.",
          root_cause: "Invalid or unmapped Balance of Payments category.",
          impact: "Incorrect regulatory classification.",
          recommended_action: "Correct BOP classification or escalate."
        };
      }
      
      return {
        summary: "Transaction blocked due to compliance violation.",
        root_cause: "Unknown anomaly detected: " + reason,
        impact: "Compliance integrity check failed.",
        recommended_action: "Escalate to compliance officer."
      };
    }

    return {
      summary: "Transaction successfully verified.",
      root_cause: "All compliance conditions satisfied.",
      impact: "No risk detected.",
      recommended_action: "Proceed with settlement."
    };
  }
}
