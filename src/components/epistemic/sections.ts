// Barrel file for lazy section loading
// Each export is a function that returns the section component dynamically
// This reduces the number of top-level dynamic imports in page.tsx

import dynamic from "next/dynamic";

export const OverviewSection = dynamic(
  () => import("./overview").then((m) => m.OverviewSection),
  { ssr: false }
);
export const PolicyStudioSection = dynamic(
  () => import("./policy-studio").then((m) => m.PolicyStudioSection),
  { ssr: false }
);
export const DagTopologySection = dynamic(
  () => import("./dag-topology").then((m) => m.DagTopologySection),
  { ssr: false }
);
export const MergeReconciliationSection = dynamic(
  () => import("./merge-reconciliation").then((m) => m.MergeReconciliationSection),
  { ssr: false }
);
export const ShadowBridgeSection = dynamic(
  () => import("./shadow-bridge").then((m) => m.ShadowBridgeSection),
  { ssr: false }
);
export const MmrProofsSection = dynamic(
  () => import("./mmr-proofs").then((m) => m.MmrProofsSection),
  { ssr: false }
);
export const InvariantMinerSection = dynamic(
  () => import("./invariant-miner").then((m) => m.InvariantMinerSection),
  { ssr: false }
);
export const CliTerminalSection = dynamic(
  () => import("./cli-terminal").then((m) => m.CliTerminalSection),
  { ssr: false }
);
export const FederationSection = dynamic(
  () => import("./federation").then((m) => m.FederationSection),
  { ssr: false }
);
export const TimelineSection = dynamic(
  () => import("./timeline").then((m) => m.TimelineSection),
  { ssr: false }
);
export const PolicyDiffSection = dynamic(
  () => import("./policy-diff").then((m) => m.PolicyDiffSection),
  { ssr: false }
);
export const ZkCircuitSection = dynamic(
  () => import("./zk-circuit").then((m) => m.ZkCircuitSection),
  { ssr: false }
);
export const AuditReportsSection = dynamic(
  () => import("./audit-reports").then((m) => m.AuditReportsSection),
  { ssr: false }
);
export const PolicyVersioningSection = dynamic(
  () => import("./policy-versioning").then((m) => m.PolicyVersioningSection),
  { ssr: false }
);
export const PerformanceMetricsSection = dynamic(
  () => import("./performance-metrics").then((m) => m.PerformanceMetricsSection),
  { ssr: false }
);
export const TemplateLibrarySection = dynamic(
  () => import("./template-library").then((m) => m.TemplateLibrarySection),
  { ssr: false }
);
export const ComparisonMatrixSection = dynamic(
  () => import("./comparison-matrix").then((m) => m.ComparisonMatrixSection),
  { ssr: false }
);
export const CoverageTreemapSection = dynamic(
  () => import("./coverage-treemap").then((m) => m.CoverageTreemapSection),
  { ssr: false }
);
