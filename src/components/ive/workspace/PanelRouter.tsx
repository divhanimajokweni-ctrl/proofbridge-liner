"use client";

import dynamic from "next/dynamic";
import { type WorkspacePanelId } from "@/lib/ive/types";

/**
 * PanelRouter
 * -----------
 * Lazy-loads each workspace panel on demand to keep the initial bundle
 * small and the workspace responsive. Heavy views (CAD, Trust Sphere
 * canvas) are only mounted when their panel is active.
 *
 * All dynamic imports are declared at module scope (NOT during render) so
 * React does not recreate the component type on each render.
 */
const loading = () => (
  <div className="flex h-full items-center justify-center">
    <div className="ive-mono flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ive-gold)] ive-live-pulse" />
      loading panel…
    </div>
  </div>
);

const OverviewPanel = dynamic(
  () => import("../panels/OverviewPanel").then((m) => m.OverviewPanel),
  { ssr: false, loading },
);
const TrustSpherePanel = dynamic(
  () => import("../panels/TrustSpherePanel").then((m) => m.TrustSpherePanel),
  { ssr: false, loading },
);
const ProofGraphPanel = dynamic(
  () => import("../panels/ProofGraphPanel").then((m) => m.ProofGraphPanel),
  { ssr: false, loading },
);
const EvidenceRuntimePanel = dynamic(
  () => import("../panels/EvidenceRuntimePanel").then((m) => m.EvidenceRuntimePanel),
  { ssr: false, loading },
);
const PluginRegistryPanel = dynamic(
  () => import("../panels/PluginRegistryPanel").then((m) => m.PluginRegistryPanel),
  { ssr: false, loading },
);
const AmdRuntimePanel = dynamic(
  () => import("../panels/AmdRuntimePanel").then((m) => m.AmdRuntimePanel),
  { ssr: false, loading },
);
const ZooRuntimePanel = dynamic(
  () => import("../panels/ZooRuntimePanel").then((m) => m.ZooRuntimePanel),
  { ssr: false, loading },
);
const HbkWorkspacePanel = dynamic(
  () => import("../panels/HbkWorkspacePanel").then((m) => m.HbkWorkspacePanel),
  { ssr: false, loading },
);
const CadViewerPanel = dynamic(
  () => import("../panels/CadViewerPanel").then((m) => m.CadViewerPanel),
  { ssr: false, loading },
);
const ArtifactsPanel = dynamic(
  () => import("../panels/ArtifactsPanel").then((m) => m.ArtifactsPanel),
  { ssr: false, loading },
);
const ExplorerPanel = dynamic(
  () => import("../panels/ExplorerPanel").then((m) => m.ExplorerPanel),
  { ssr: false, loading },
);
const TelemetryPanel = dynamic(
  () => import("../panels/TelemetryPanel").then((m) => m.TelemetryPanel),
  { ssr: false, loading },
);
const TerminalPanel = dynamic(
  () => import("../panels/TerminalPanel").then((m) => m.TerminalPanel),
  { ssr: false, loading },
);
const WatchdogPanel = dynamic(
  () => import("../panels/WatchdogPanel").then((m) => m.WatchdogPanel),
  { ssr: false, loading },
);
const LindiwePanel = dynamic(
  () => import("../panels/LindiwePanel").then((m) => m.LindiwePanel),
  { ssr: false, loading },
);
const ReleaseReportPanel = dynamic(
  () => import("../panels/ReleaseReportPanel").then((m) => m.ReleaseReportPanel),
  { ssr: false, loading },
);
const AdapterAttributionPanel = dynamic(
  () => import("../panels/AdapterAttributionPanel").then((m) => m.AdapterAttributionPanel),
  { ssr: false, loading },
);
const IntegrityClosurePanel = dynamic(
  () => import("../panels/IntegrityClosurePanel").then((m) => m.IntegrityClosurePanel),
  { ssr: false, loading },
);
const IdentityRegistryPanel = dynamic(
  () => import("../panels/IdentityRegistryPanel").then((m) => m.IdentityRegistryPanel),
  { ssr: false, loading },
);
const AcceptanceChecklistPanel = dynamic(
  () => import("../panels/AcceptanceChecklistPanel").then((m) => m.AcceptanceChecklistPanel),
  { ssr: false, loading },
);

const PANEL_COMPONENTS: Record<WorkspacePanelId, React.ComponentType> = {
  overview: OverviewPanel,
  trust: TrustSpherePanel,
  proof: ProofGraphPanel,
  evidence: EvidenceRuntimePanel,
  plugins: PluginRegistryPanel,
  amd: AmdRuntimePanel,
  zoo: ZooRuntimePanel,
  hbk: HbkWorkspacePanel,
  cad: CadViewerPanel,
  artifacts: ArtifactsPanel,
  explorer: ExplorerPanel,
  telemetry: TelemetryPanel,
  terminal: TerminalPanel,
  watchdog: WatchdogPanel,
  lindiwe: LindiwePanel,
  release: ReleaseReportPanel,
  adapter: AdapterAttributionPanel,
  integrity: IntegrityClosurePanel,
  identity: IdentityRegistryPanel,
  acceptance: AcceptanceChecklistPanel,
};

export function PanelRouter({ panel }: { panel: WorkspacePanelId }) {
  const Panel = PANEL_COMPONENTS[panel] ?? OverviewPanel;
  return <Panel />;
}
