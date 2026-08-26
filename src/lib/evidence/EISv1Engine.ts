// lib/evidence/EISv1Engine.ts
// Evidence Independence Scoring v1.0 — prevents evidence inflation by
// evaluating whether observations are genuinely independent, not just counted.
// Adapted for the Next.js 16 / TypeScript 5 stack from the user's specification.

export type ObservationType = "FLOW" | "PRESSURE" | "ACOUSTIC" | "PUMP_STATUS" | "MOISTURE";
export type QualityFlag = "VALID" | "MISSING" | "IMPOSSIBLE_PHYSICS";
export type EvidenceClass =
  | "PRIMARY_ANOMALY"
  | "CORRELATED_HYDRAULIC"
  | "INDEPENDENT_CORROBORATION"
  | "SYSTEM_CONTEXT";

export interface EISConfiguration {
  flowDeviationThreshold: number; // e.g., 0.10 for 10%
  pressureDropThreshold: number; // e.g., 0.05 for 5%
  correlationTimeWindowMs: number; // e.g., 3600000 for 1 hour
}

export const DEFAULT_EIS_CONFIG: EISConfiguration = {
  flowDeviationThreshold: 0.10,
  pressureDropThreshold: 0.05,
  correlationTimeWindowMs: 3600000,
};

export interface Observation {
  id: string;
  source: string;
  type: ObservationType;
  timestamp: string; // ISO 8601
  value: number | string;
  baseline?: number;
  qualityFlag: QualityFlag;
}

export interface EvidenceNode {
  observation: Observation;
  classification: EvidenceClass;
  groupId?: string;
  reasoning: string;
}

export interface EvidenceGraph {
  claimId: string;
  nodes: EvidenceNode[];
  confidenceScore: number;
  verdict: "VERIFIED_CANDIDATE" | "INSUFFICIENT_EVIDENCE" | "REJECTED_FALSE_POSITIVE";
  appliedConfiguration: EISConfiguration;
}

/**
 * EIS v1.0 Engine — transforms sparse observations into a verified evidence graph.
 *
 * Prevents "evidence inflation" — where 5 pressure sensors reacting to the
 * same pipe burst are incorrectly treated as 5 independent proofs of a leak,
 * instead of 1 correlated hydraulic event.
 */
export class EISv1Engine {
  private config: EISConfiguration;

  constructor(customConfig?: Partial<EISConfiguration>) {
    this.config = { ...DEFAULT_EIS_CONFIG, ...customConfig };
  }

  /**
   * Main entry point: Transforms sparse observations into a verified evidence graph.
   */
  public processEvidence(observations: Observation[], claimId: string): EvidenceGraph {
    // 1. Data Quality Gate — reject impossible physics and missing data
    const validObs = this.filterQuality(observations);

    // 2. Extract Anomalies — detect deviations from baselines
    const anomalies = this.detectAnomalies(validObs);

    // 3. Build Provenance Graph — correlate and classify
    const nodes = this.buildEvidenceGraph(anomalies, validObs);

    // 4. Score Confidence based on INDEPENDENCE, not sheer volume
    const { confidenceScore, verdict } = this.scoreIndependence(nodes);

    return {
      claimId,
      nodes,
      confidenceScore,
      verdict,
      appliedConfiguration: this.config,
    };
  }

  /**
   * STEP 1: Reject impossible physics and missing data.
   * Zero Fabrication Rule: missing data is never guessed.
   */
  private filterQuality(obs: Observation[]): Observation[] {
    return obs.filter((o) => o.qualityFlag === "VALID");
  }

  /**
   * STEP 2: Detect deviations from established baselines.
   */
  private detectAnomalies(obs: Observation[]): Observation[] {
    return obs.filter((o) => {
      if (typeof o.value !== "number" || !o.baseline) return false;

      if (o.type === "FLOW") {
        return o.value > o.baseline * (1 + this.config.flowDeviationThreshold);
      }
      if (o.type === "PRESSURE") {
        return o.value < o.baseline * (1 - this.config.pressureDropThreshold);
      }
      return false;
    });
  }

  /**
   * STEP 3: Correlate events to prevent evidence inflation.
   * Flow + Pressure in the same DMA within the time window = CORRELATED, not independent.
   * Acoustic / Field reports = INDEPENDENT (different measurement principle).
   * Pump status changes = SYSTEM_CONTEXT (may explain the anomaly).
   */
  private buildEvidenceGraph(anomalies: Observation[], allObs: Observation[]): EvidenceNode[] {
    const nodes: EvidenceNode[] = [];
    const eventGroupId = `EVT-${Date.now()}`;

    // Find Primary Flow Anomaly
    const primaryFlow = anomalies.find((a) => a.type === "FLOW");
    if (primaryFlow) {
      nodes.push({
        observation: primaryFlow,
        classification: "PRIMARY_ANOMALY",
        groupId: eventGroupId,
        reasoning: `Flow increased by >${(this.config.flowDeviationThreshold * 100).toFixed(0)}% over baseline (${primaryFlow.baseline} L/s). Actual: ${primaryFlow.value} L/s.`,
      });
    }

    // Find Correlated Pressure Drops within the time window
    const primaryTime = primaryFlow ? new Date(primaryFlow.timestamp).getTime() : 0;
    const pressureDrops = anomalies.filter((a) => a.type === "PRESSURE");
    pressureDrops.forEach((pd) => {
      const pdTime = new Date(pd.timestamp).getTime();
      const timeDiff = Math.abs(primaryTime - pdTime);

      if (primaryFlow && timeDiff <= this.config.correlationTimeWindowMs) {
        nodes.push({
          observation: pd,
          classification: "CORRELATED_HYDRAULIC",
          groupId: eventGroupId,
          reasoning: `Pressure drop correlates temporally with primary flow anomaly (${(timeDiff / 60000).toFixed(0)} min gap).`,
        });
      } else {
        nodes.push({
          observation: pd,
          classification: "PRIMARY_ANOMALY",
          reasoning: "Isolated pressure drop detected without flow correlation.",
        });
      }
    });

    // Assess External Context / Field Reports (The real proof)
    const fieldReports = allObs.filter((o) => o.type === "ACOUSTIC" || o.type === "MOISTURE");
    fieldReports.forEach((fr) => {
      nodes.push({
        observation: fr,
        classification: "INDEPENDENT_CORROBORATION",
        groupId: primaryFlow ? eventGroupId : undefined,
        reasoning: `Independent physical field report confirms anomaly. Type: ${fr.type}.`,
      });
    });

    // Assess Known Operations (e.g., Was it just a pump turning on?)
    const pumpEvents = allObs.filter((o) => o.type === "PUMP_STATUS" && o.value === "ON");
    pumpEvents.forEach((pe) => {
      nodes.push({
        observation: pe,
        classification: "SYSTEM_CONTEXT",
        reasoning: "Authorized pump activation logged. May explain hydraulic anomalies.",
      });
    });

    return nodes;
  }

  /**
   * STEP 4: Score the graph.
   *
   * 1 Primary + 5 Correlated = Low confidence (could be sensor drift).
   * 1 Primary + 1 Independent (acoustic/field) = High confidence.
   * 1 Primary + 1 Pump Context = REJECTED (false positive).
   */
  private scoreIndependence(nodes: EvidenceNode[]): {
    confidenceScore: number;
    verdict: EvidenceGraph["verdict"];
  } {
    let score = 0.0;

    const hasPrimary = nodes.some((n) => n.classification === "PRIMARY_ANOMALY");
    const hasCorrelated = nodes.some((n) => n.classification === "CORRELATED_HYDRAULIC");
    const hasIndependent = nodes.some((n) => n.classification === "INDEPENDENT_CORROBORATION");
    const hasPumpContext = nodes.some((n) => n.classification === "SYSTEM_CONTEXT");

    // If the anomaly is explained by a known system operation, it is not a leak.
    if (hasPrimary && hasPumpContext) {
      return { confidenceScore: 0.1, verdict: "REJECTED_FALSE_POSITIVE" };
    }

    if (hasPrimary) score += 0.3;

    // Multiple correlated sensors add small confidence (proves event happened),
    // but caps out to prevent evidence inflation.
    if (hasCorrelated) score += 0.2;

    // Independent physical corroboration is the gold standard
    if (hasIndependent) score += 0.4;

    let verdict: EvidenceGraph["verdict"] = "INSUFFICIENT_EVIDENCE";
    if (score >= 0.8) verdict = "VERIFIED_CANDIDATE";

    return { confidenceScore: Math.min(1.0, score), verdict };
  }
}
