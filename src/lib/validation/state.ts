export type ValidationLifecycleState =
  | "REHEARSAL"
  | "RUNNING"
  | "VERIFYING"
  | "COMPLETE"
  | "FAILED"
  | "ARCHIVED"
  | "DEPLOY_PENDING"
  | "DEPLOYING"
  | "DEPLOYED"
  | "HEALTH_CHECK"
  | "PRODUCTION_ACTIVE";

export interface ValidationLifecycle {
  state: ValidationLifecycleState;
  phase: string | null;
  activeGate: string | null;
  currentGate: string | null;
  score: number | null;
  elapsed: number | null;
  runtimeHealthy: boolean | null;
  replayPassed: boolean | null;
  archivePassed: boolean | null;
  frozenBuildVerified: boolean | null;
  deploymentEligible: boolean | null;
  productionDeployed: boolean | null;
  nextAction: string | null;
  currentHour: number | null;
  currentPhase: string | null;
  validationIndex: number | null;
  evidenceReady: boolean | null;
  deploymentReady: boolean | null;
  productionPublished: boolean | null;
  gatePassed: boolean | null;
  deployPhase: string | null;
}

export const DEFAULT_LIFECYCLE: ValidationLifecycle = {
  state: "REHEARSAL",
  phase: null,
  activeGate: null,
  currentGate: null,
  score: null,
  elapsed: null,
  runtimeHealthy: null,
  replayPassed: null,
  archivePassed: null,
  frozenBuildVerified: null,
  deploymentEligible: null,
  productionDeployed: null,
  nextAction: null,
  currentHour: null,
  currentPhase: null,
  validationIndex: null,
  evidenceReady: null,
  deploymentReady: null,
  productionPublished: null,
  gatePassed: null,
  deployPhase: null,
};

export interface GateResult {
  gate: string;
  passed: boolean;
  detail?: string;
}

export const DEFAULT_GATES: GateResult[] = [
  { gate: "A", passed: false, detail: "Rehearsal" },
  { gate: "B", passed: false, detail: "Evidence" },
  { gate: "C", passed: false, detail: "Kubernetes" },
  { gate: "D", passed: false, detail: "GitOps" },
  { gate: "E", passed: false, detail: "CI/CD" },
  { gate: "F", passed: false, detail: "Documentation" },
  { gate: "G", passed: false, detail: "Release" },
];

export function lifecycleSummary(lifecycle: ValidationLifecycle) {
  const stateLabel = lifecycle.state;
  const hourLabel = lifecycle.currentHour != null ? `Hour ${lifecycle.currentHour} / 72` : "Not started";
  const indexLabel = lifecycle.validationIndex != null ? `${Math.round((lifecycle.validationIndex ?? 0) * 100)}%` : "—";
  const runtimeLabel =
    lifecycle.runtimeHealthy === true ? "Healthy" : lifecycle.runtimeHealthy === false ? "Degraded" : "—";
  const evidenceLabel = lifecycle.evidenceReady === true ? `${lifecycle.currentHour ?? 0} Bundles` : lifecycle.evidenceReady === false ? "Incomplete" : "—";
  const deployLabel =
    lifecycle.deployPhase ?? lifecycle.productionPublished === true ? "Published" : lifecycle.deploymentReady === true ? "Build Ready" : "—";
  return { stateLabel, hourLabel, indexLabel, runtimeLabel, evidenceLabel, deployLabel };
}
