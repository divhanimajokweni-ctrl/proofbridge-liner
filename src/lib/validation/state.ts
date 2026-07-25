export type ValidationLifecycleState = "REHEARSAL" | "RUNNING" | "VERIFYING" | "COMPLETE" | "FAILED" | "ARCHIVED";

export interface ValidationLifecycle {
  state: ValidationLifecycleState;
  currentHour: number | null;
  currentPhase: string | null;
  validationIndex: number | null;
  runtimeHealthy: boolean | null;
  evidenceReady: boolean | null;
  replayPassed: boolean | null;
  deploymentReady: boolean | null;
  productionPublished: boolean | null;
}

export const DEFAULT_LIFECYCLE: ValidationLifecycle = {
  state: "REHEARSAL",
  currentHour: null,
  currentPhase: null,
  validationIndex: null,
  runtimeHealthy: null,
  evidenceReady: null,
  replayPassed: null,
  deploymentReady: null,
  productionPublished: null,
};

export function lifecycleSummary(lifecycle: ValidationLifecycle) {
  const stateLabel = lifecycle.state;
  const hourLabel = lifecycle.currentHour != null ? `Hour ${lifecycle.currentHour} / 72` : "Not started";
  const indexLabel = lifecycle.validationIndex != null ? `${Math.round((lifecycle.validationIndex ?? 0) * 100)}%` : "—";
  const runtimeLabel =
    lifecycle.runtimeHealthy === true ? "Healthy" : lifecycle.runtimeHealthy === false ? "Degraded" : "—";
  const evidenceLabel = lifecycle.evidenceReady === true ? `${lifecycle.currentHour ?? 0} Bundles` : lifecycle.evidenceReady === false ? "Incomplete" : "—";
  const deployLabel = lifecycle.deploymentReady === true ? `${lifecycle.productionPublished === true ? "Published" : "Build Ready"}` : "—";
  return { stateLabel, hourLabel, indexLabel, runtimeLabel, evidenceLabel, deployLabel };
}
