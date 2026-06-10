/**
 * File: src/lib/watchdog/HeartbeatSchema.ts
 * Description: Operational Tags, Incident Contracts, and Fault Classification Engine.
 */
export enum OpTag {
  // P-0x Operational Specs
  P01_TAB_COORD = 'P01_TAB_COORD',
  P02_NETWORK_SYNC = 'P02_NETWORK_SYNC',
  P03_CACHE_EVICT = 'P03_CACHE_EVICT',
  P04_IDB_ABORT = 'P04_IDB_ABORT',
  P05_STATE_MUTATION = 'P05_STATE_MUTATION',
  P06_INDEX_MISMATCH = 'P06_INDEX_MISMATCH',

  // Gate A: Auth & Identity Infrastructure
  GATE_A_COOKIE_FAULT = 'GATE_A_COOKIE_FAULT',
  GATE_A_MIDDLEWARE_LOOP = 'GATE_A_MIDDLEWARE_LOOP',
  GATE_A_RLS_VIOLATION = 'GATE_A_RLS_VIOLATION',
  GATE_A_SESSION_TIMEOUT = 'GATE_A_SESSION_TIMEOUT',
  GATE_A_CALLBACK_FAILED = 'GATE_A_CALLBACK_FAILED',
  GATE_A_HEALTH_DEGRADED = 'GATE_A_HEALTH_DEGRADED',

  // Gate B: Contribution Rail Infrastructure (Pre-Registered)
  GATE_B_PAYMENT_WEBHOOK_FAIL = 'GATE_B_PAYMENT_WEBHOOK_FAIL',
  GATE_B_LEDGER_MISMATCH = 'GATE_B_LEDGER_MISMATCH',
  GATE_B_FX_ORACLE_TIMEOUT = 'GATE_B_FX_ORACLE_TIMEOUT',
  GATE_B_IDEMPOTENCY_LOCK = 'GATE_B_IDEMPOTENCY_LOCK',

  UNKNOWN = 'UNKNOWN'
}
export type FaultPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface Incident {
  id: string;
  opTag: OpTag;
  summary: string;
  errorLog: string;
  opHint: string;
  priority: FaultPriority;
  specRef: string;
  timestamp: number;
}
export interface FaultRule {
  keywords: string[];
  priority: FaultPriority;
  opHint: string;
}
export const FAULT_RULES: Record<OpTag, FaultRule> = {
  [OpTag.P01_TAB_COORD]: { keywords: ['leadership', 'coordinator', 'tab'], priority: 'HIGH', opHint: 'Re-negotiate multi-tab state master.' },
  [OpTag.P02_NETWORK_SYNC]: { keywords: ['network', 'fetch', 'sync', 'offline'], priority: 'MEDIUM', opHint: 'Verify local sync buffers and backoff.' },
  [OpTag.P03_CACHE_EVICT]: { keywords: ['cache', 'eviction', 'quota'], priority: 'LOW', opHint: 'Clear low-priority reactive caches.' },
  [OpTag.P04_IDB_ABORT]: { keywords: ['indexeddb', 'abort', 'transaction'], priority: 'CRITICAL', opHint: 'Cycle IndexedDB connection or purge poisoned store.' },
  [OpTag.P05_STATE_MUTATION]: { keywords: ['mutation', 'invariant', 'flux'], priority: 'HIGH', opHint: 'Roll back state vector to last clear checkpoint.' },
  [OpTag.P06_INDEX_MISMATCH]: { keywords: ['index', 'sequence', 'mismatch'], priority: 'CRITICAL', opHint: 'Re-index physical stores from server source.' },

  [OpTag.GATE_A_COOKIE_FAULT]: { keywords: ['cookies', 'async', 'unawaited', 'header'], priority: 'CRITICAL', opHint: 'Await Next.js cookies() wrapper explicitly in route handler.' },
  [OpTag.GATE_A_MIDDLEWARE_LOOP]: { keywords: ['redirect', 'loop', 'max_redirects', 'middleware'], priority: 'CRITICAL', opHint: 'Ensure target auth routes are added to PUBLIC_PATHS.' },
  [OpTag.GATE_A_RLS_VIOLATION]: { keywords: ['rls', 'policy', 'violates', 'denied'], priority: 'CRITICAL', opHint: 'Verify explicit schema type casting (e.g., matching UUID types).' },
  [OpTag.GATE_A_SESSION_TIMEOUT]: { keywords: ['session', 'expired', 'token'], priority: 'MEDIUM', opHint: 'Trigger soft authentication refresh token cycle.' },
  [OpTag.GATE_A_CALLBACK_FAILED]: { keywords: ['callback', 'exchange', 'code'], priority: 'HIGH', opHint: 'Verify code verifier parameters or network auth latency.' },
  [OpTag.GATE_A_HEALTH_DEGRADED]: { keywords: ['health', 'degraded', 'database', 'auth'], priority: 'HIGH', opHint: 'Check backing third-party platform provider status pages.' },

  [OpTag.GATE_B_PAYMENT_WEBHOOK_FAIL]: { keywords: ['webhook', 'signature', 'payment'], priority: 'CRITICAL', opHint: 'Verify upstream signing secrets and request timestamps.' },
  [OpTag.GATE_B_LEDGER_MISMATCH]: { keywords: ['ledger', 'balance', 'mismatch'], priority: 'CRITICAL', opHint: 'Lock contribution processing pipeline and run reconciliation engine.' },
  [OpTag.GATE_B_FX_ORACLE_TIMEOUT]: { keywords: ['fx', 'oracle', 'rate', 'timeout'], priority: 'HIGH', opHint: 'Fallback to secondary static market rate matrix configuration.' },
  [OpTag.GATE_B_IDEMPOTENCY_LOCK]: { keywords: ['idempotency', 'lock', 'duplicate'], priority: 'MEDIUM', opHint: 'Reject matching external reference payload safely.' },

  [OpTag.UNKNOWN]: { keywords: [], priority: 'LOW', opHint: 'Review unclassified internal error stream metrics.' }
};
export function classifyFault(opTag: OpTag, errorLog: string, summary: string): Incident {
  const rule = FAULT_RULES[opTag] || FAULT_RULES[OpTag.UNKNOWN];
  return {
    id: `inc_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
    opTag,
    summary,
    errorLog,
    opHint: rule.opHint,
    priority: rule.priority,
    specRef: `vvu-spec-${opTag.toLowerCase().replace(/_/g, '-')}`,
    timestamp: Date.now()
  };
}