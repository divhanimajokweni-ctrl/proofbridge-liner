// ============================================================================
// VVU Trust Runtime — Projection Manager
// ============================================================================
// Layer:        Projection Manager
// Responsibility: Derive consumer-specific projections from RuntimeState.
//                 Each projection is a pure derivation — no side effects.
// ============================================================================

import {
  RuntimeState,
  ColonyProjection,
  UIProjection,
  MetricsProjection,
  NotificationProjection,
  Alert,
  RuntimeEvent,
  RuntimeEventType,
} from "./types";

// ---------------------------------------------------------------------------
// Colony Projection
// ---------------------------------------------------------------------------

/**
 * Derive the colony view from the current runtime state.
 * The colony is a metaphor for the verification swarm:
 *   - "ants" = verification workers
 *   - "leaves" = evidence items
 *   - "canopy" = the ledger's state overview
 *   - "sentinel" = the circuit breaker / watchtower
 */
export function buildColonyProjection(state: RuntimeState): ColonyProjection {
  const totalLeaves = state.evidenceLeaves.length;
  const verifiedLeaves = state.evidenceLeaves.filter((l) => l.verified).length;

  return {
    activeCarriers: state.kernelState === "VERIFYING" ? 4 : state.kernelState === "INGESTING" ? 2 : 0,
    verificationQueueDepth: Math.max(0, totalLeaves - verifiedLeaves),
    canopyLeafCount: totalLeaves,
    canopyGrowthRate: computeGrowthRate(state),
    sentinelPatrolIntensity:
      state.circuitBreakerOpen ? 1.0
      : state.kernelState === "HAZARD" ? 0.9
      : state.kernelState === "SETTLED" ? 0.3
      : state.kernelState === "IDLE" ? 0.1
      : 0.5,
    kernelState: state.kernelState,
    trustScore: state.trust,
    hazardMode: state.kernelState === "HAZARD",
    hasUnverifiedEvidence: totalLeaves > verifiedLeaves,
  };
}

function computeGrowthRate(state: RuntimeState): number {
  // Rough heuristic: leaves per minute based on epoch transitions
  const uptime = (state.lastEventAt - state.startedAt) / 60000; // minutes
  if (uptime < 0.1) return 0;
  return Math.round((state.evidenceLeaves.length / Math.max(1, uptime)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// UI Projection
// ---------------------------------------------------------------------------

/**
 * Derive the UI-consumable view from the runtime state.
 * All animation and rendering decisions are driven by this projection.
 */
export function buildUIProjection(state: RuntimeState): UIProjection {
  return {
    kernelState: state.kernelState,
    trust: state.trust,
    sigma: state.sigma,
    confidence: state.confidence,
    epoch: state.epoch,
    quorum: { ...state.quorum },
    sequence: state.sequence,
    hashChainIntact: state.hashChainIntact,
    circuitBreakerOpen: state.circuitBreakerOpen,
    hazardReason: state.hazardReason,
    lastError: state.lastError
      ? { code: state.lastError.code, message: state.lastError.message }
      : null,
    evidenceLeaves: [...state.evidenceLeaves],
    receipts: [...state.receipts],
  };
}

// ---------------------------------------------------------------------------
// Metrics Projection
// ---------------------------------------------------------------------------

export function buildMetricsProjection(
  state: RuntimeState,
  prevMetrics?: Partial<MetricsProjection>,
): MetricsProjection {
  const eventCount = state.sequence;
  const uptime = Math.max(1, (state.lastEventAt - state.startedAt) / 60000); // minutes
  const verificationFailures = state.quorum.total - state.quorum.pass;
  const avgConfidence = state.evidenceLeaves.length > 0
    ? state.evidenceLeaves.reduce((sum, l) => {
        const weights = { low: 0.3, medium: 0.6, high: 0.9 };
        return sum + (weights[l.confidence] ?? 0.5);
      }, 0) / state.evidenceLeaves.length * 100
    : 50;

  return {
    eventCount,
    eventRate: Math.round((eventCount / uptime) * 10) / 10,
    verificationCount: state.quorum.total,
    verificationFailures,
    circuitBreakerTriggers: prevMetrics?.circuitBreakerTriggers ?? 0,
    averageConfidence: Math.round(avgConfidence * 10) / 10,
    hazardEventCount: prevMetrics?.hazardEventCount ?? 0,
    renderLatency: prevMetrics?.renderLatency ?? 0,
    droppedFrames: prevMetrics?.droppedFrames ?? 0,
    fps: prevMetrics?.fps ?? 60,
  };
}

// ---------------------------------------------------------------------------
// Notification Projection
// ---------------------------------------------------------------------------

const SEVERITY_MAP: Record<string, "info" | "warning" | "critical"> = {
  CircuitBreakerOpened: "critical",
  SystemError: "critical",
  AttestationFailed: "warning",
  EvidenceRejected: "warning",
  ReceiptFailed: "warning",
  CircuitBreakerClosed: "info",
  ReceiptCommitted: "info",
  LedgerConfirmed: "info",
};

export function buildNotificationProjection(
  state: RuntimeState,
  events: RuntimeEvent[],
): NotificationProjection {
  const unverifiedCount = state.evidenceLeaves.filter((l) => !l.verified).length;

  const alerts: Alert[] = events
    .filter((e) => e.type in SEVERITY_MAP)
    .slice(-10) // keep last 10 alertable events
    .map((e) => ({
      id: e.eventId,
      severity: SEVERITY_MAP[e.type] ?? "info",
      message: alertMessage(e.type, e.payload as Record<string, string>),
      eventType: e.type,
      timestamp: e.timestamp,
      acknowledged: false,
    }));

  return {
    activeAlerts: alerts,
    hazardMode: state.kernelState === "HAZARD",
    circuitBreakerOpen: state.circuitBreakerOpen,
    unverifiedCount,
    pendingVerifications: state.kernelState === "VERIFYING" ? unverifiedCount : 0,
  };
}

function alertMessage(type: RuntimeEventType, payload: Record<string, string>): string {
  switch (type) {
    case "CircuitBreakerOpened":
      return `Circuit breaker opened: ${payload.reason ?? "unknown"}`;
    case "SystemError":
      return `[${payload.code}] ${payload.message ?? "system error"}`;
    case "AttestationFailed":
      return `Attestation failed for ${payload.receiptId ?? "unknown receipt"}`;
    case "EvidenceRejected":
      return `Evidence rejected: ${payload.reason ?? "no reason"}`;
    case "ReceiptFailed":
      return `Receipt commit failed: ${payload.receiptId ?? "unknown"}`;
    case "CircuitBreakerClosed":
      return "Circuit breaker closed — resuming operations.";
    case "ReceiptCommitted":
      return `Receipt ${payload.receiptId?.slice(0, 8) ?? ""} committed.`;
    case "LedgerConfirmed":
      return `Ledger confirmed at block ${payload.blockHeight ?? "?"}`;
    default:
      return `Event: ${type}`;
  }
}

// ---------------------------------------------------------------------------
// Projection Manager — Aggregate All Projections
// ---------------------------------------------------------------------------

export interface AllProjections {
  colony: ColonyProjection;
  ui: UIProjection;
  metrics: MetricsProjection;
  notifications: NotificationProjection;
}

export function buildAllProjections(
  state: RuntimeState,
  recentEvents?: RuntimeEvent[],
): AllProjections {
  return {
    colony: buildColonyProjection(state),
    ui: buildUIProjection(state),
    metrics: buildMetricsProjection(state),
    notifications: buildNotificationProjection(state, recentEvents ?? []),
  };
}
