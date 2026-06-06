export const SCHEMA_VERSION = "2.0" as const;

export const PRIORITY = {
  CRITICAL: "CRITICAL",
  HIGH:     "HIGH",
  NORMAL:   "NORMAL",
} as const;
export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

export const OP_TAG = {
  LEADER_LOCK_LOST:        "leader_lock_lost",
  HEARTBEAT_STALL:         "heartbeat_stall",
  IDEMPOTENCY_TTL_BREACH:  "idempotency_ttl_breach",
  DUPLICATE_COMMAND:       "duplicate_command",
  SNAPSHOT_CORRUPT:        "snapshot_corrupt",
  REPLAY_OFFSET_GAP:       "replay_offset_gap",
  IDB_ABORT:               "idb_abort",
  IDB_QUOTA_EXCEEDED:      "idb_quota_exceeded",
  TOXIC_PACKET_DETECTED:   "toxic_packet_detected",
  SCHEMA_UPCASTER_FAIL:    "schema_upcaster_fail",
  VERSION_INDEX_CORRUPT:   "version_index_corrupt",
  REHYDRATION_TRIGGERED:   "rehydration_triggered",
  UNKNOWN:                 "unknown",
} as const;
export type OpTag = typeof OP_TAG[keyof typeof OP_TAG];

export interface Incident {
  readonly id:           string;
  readonly summary:      string;
  readonly priority:     Priority;
  readonly errorLog:     string;
  readonly opHint:       OpTag;
  readonly triggeredBy:  string;
  readonly timestamp:    string;
  readonly specRef:      string;
  resolved:              boolean;
  resolvedAt?:           string;
  resolutionOutput?:     string;
}

export interface HeartbeatState {
  schemaVersion:  string;
  lastCheck:      string;
  systemStatus:   "NOMINAL" | "REMEDIATING" | "DEGRADED";
  cycle:          number;
  openCount:      number;
  resolvedCount:  number;
  incidents:      Incident[];
}

export function makeIncidentId(): string {
  return `INC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function utcNow(): string {
  return new Date().toISOString();
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH:     1,
  NORMAL:   2,
};

export function sortByPriority(incidents: Incident[]): Incident[] {
  return [...incidents].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}
