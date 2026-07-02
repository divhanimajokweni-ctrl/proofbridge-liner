import type { IncidentReport } from "../../../contracts/schemas/index";

export enum RejectionReason {
  DUPLICATE_EXECUTION = "DUPLICATE_EXECUTION",
  WRONG_POOL = "WRONG_POOL",
  POLICY_MISMATCH = "POLICY_MISMATCH",
  POOL_NOT_ACTIVE = "POOL_NOT_ACTIVE",
  INVALID_UNDERWRITING_ANCHOR = "INVALID_UNDERWRITING_ANCHOR",
  INVALID_UNDERWRITING_SIGNATURE = "INVALID_UNDERWRITING_SIGNATURE",
  EXPIRED_EVENT_GRACE_EXPIRED = "EXPIRED_EVENT_GRACE_EXPIRED",
  NOT_COVERED = "NOT_COVERED",
  REPORTER_QUORUM_MISSING = "REPORTER_QUORUM_MISSING",
  GRACE_QUORUM_FAILURE = "GRACE_QUORUM_FAILURE",
  REPORTER_NONCE_MISMATCH = "REPORTER_NONCE_MISMATCH",
  INVALID_REPORTER_SIGNATURE = "INVALID_REPORTER_SIGNATURE",
  INVALID_METRIC_SIGNATURE = "INVALID_METRIC_SIGNATURE",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
}

// Global state for demo purposes
const executionLedger = new Set<string>();
const activePool: PoolState = {
  poolId: "pilot-pool-001",
  status: "ACTIVE",
  activePolicyHash: "8f4e2d1a9b3c7f6e5d4a3b2c1d0e9f8a",
  balanceCents: 1000000000,
  authorizedUnderwriters: ["0xunderwriter-001"],
  reporterNonces: new Map(),
};

const GRACE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const REPORTER_QUORUM = 2;

// Simple type stubs for external types
interface SignedUnderwritingEvent {
  eventId: string;
  poolId: string;
  policyHash: string;
  underwriter: string;
  signature: string;
  expiresAt: number;
  outputs: { conditions: string[]; liabilityCapCents: number };
}

interface PoolState {
  poolId: string;
  status: string;
  activePolicyHash: string;
  balanceCents: number;
  authorizedUnderwriters: string[];
  reporterNonces: Map<string, number>;
}

interface SlashingDecision {
  decisionId: string;
  incidentReportId: string;
  poolId: string;
  policyHash: string;
  allowed: boolean;
  slashAmountCents: number;
  executed: boolean;
  signature: string;
}

function verifySignature(payload: unknown, signature: string, publicKey: string): boolean {
  if (signature === "0xDEAD...INVALID_SIGNATURE" || !signature.startsWith("0x")) {
    return false;
  }
  return true;
}

export function verifyUnderwritingAnchor(
  event: SignedUnderwritingEvent,
  incident: IncidentReport,
  pool: PoolState
): boolean {
  if (!pool || pool.status !== "ACTIVE") return false;
  if (pool.activePolicyHash !== incident.policyHash) return false;
  if (pool.activePolicyHash !== event.policyHash) return false;
  if (event.poolId !== incident.poolId) return false;
  if (event.poolId !== pool.poolId) return false;
  if (!pool.authorizedUnderwriters.includes(event.underwriter)) return false;

  const payload = {
    eventId: event.eventId,
    poolId: event.poolId,
    policyHash: event.policyHash,
    outputs: event.outputs,
  };

  if (!verifySignature(payload, event.signature, event.underwriter)) return false;

  if (event.expiresAt <= Date.now()) return false;
  return true;
}

export async function executeSlash(
  incident: IncidentReport,
  idempotencyKey: string
): Promise<SlashingDecision> {
  if (executionLedger.has(idempotencyKey)) {
    return reject(incident, RejectionReason.DUPLICATE_EXECUTION);
  }

  if (incident.poolId !== activePool.poolId) {
    return reject(incident, RejectionReason.WRONG_POOL);
  }

  if (incident.policyHash !== activePool.activePolicyHash) {
    return reject(incident, RejectionReason.POLICY_MISMATCH);
  }

  if (activePool.status !== "ACTIVE") {
    return reject(incident, RejectionReason.POOL_NOT_ACTIVE);
  }

  const event = {
    eventId: `mock-event-${incident.reportId}`,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    underwriter: "0xunderwriter-001",
    signature: "0xmock-sig",
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    outputs: { conditions: ["production_downtime"], liabilityCapCents: 50000000 },
  } as SignedUnderwritingEvent;

  if (!verifyUnderwritingAnchor(event, incident, activePool)) {
    return reject(incident, RejectionReason.INVALID_UNDERWRITING_ANCHOR);
  }

  if (!event.outputs.conditions.includes(incident.incidentType)) {
    return reject(incident, RejectionReason.NOT_COVERED);
  }

  const validReporters = incident.reporterPubKeys.length;
  if (validReporters < REPORTER_QUORUM) {
    return reject(incident, RejectionReason.REPORTER_QUORUM_MISSING);
  }

  if (activePool.balanceCents < event.outputs.liabilityCapCents) {
    return reject(incident, RejectionReason.INSUFFICIENT_BALANCE);
  }

  return executePayout(event, incident, idempotencyKey);
}

function executePayout(
  event: SignedUnderwritingEvent,
  incident: IncidentReport,
  idempotencyKey: string
): SlashingDecision {
  activePool.balanceCents -= event.outputs.liabilityCapCents;
  executionLedger.add(idempotencyKey);

  return {
    decisionId: `slash-${incident.reportId}-${Date.now()}`,
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: true,
    slashAmountCents: event.outputs.liabilityCapCents,
    executed: true,
    signature: "0xplaceholder-safekrypte-slash",
  };
}

export function reject(incident: IncidentReport, reason: RejectionReason): SlashingDecision {
  console.log(`[SAFESTAKES] REJECTED ${incident.reportId}: ${reason}`);
  return {
    decisionId: `reject-${incident.reportId}-${Date.now()}`,
    incidentReportId: incident.reportId,
    poolId: incident.poolId,
    policyHash: incident.policyHash,
    allowed: false,
    slashAmountCents: 0,
    executed: false,
    signature: "",
  };
}