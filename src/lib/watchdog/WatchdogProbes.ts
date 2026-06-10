/**
 * File: src/lib/watchdog/WatchdogProbes.ts
 * Description: Operational probe classes supporting direct error boundary instrumentation.
 */
import { OpTag, classifyFault } from './HeartbeatSchema';import { HeartbeatBus } from './HeartbeatBus';
export interface IWatchdogProbe {
  fire(summary: string, detail: string): void;
}
export class NullProbe implements IWatchdogProbe {
  public fire(summary: string, detail: string): void {}
}
abstract class BaseProbe implements IWatchdogProbe {
  protected constructor(protected opTag: OpTag) {}
  public fire(summary: string, detail: string): void {
    const incident = classifyFault(this.opTag, detail, summary);
    HeartbeatBus.getInstance().dispatch(incident);
  }
}
// Operational Probes (P01 - P06)export class P01TabCoordProbe extends BaseProbe { constructor() { super(OpTag.P01_TAB_COORD); } }export class P02NetworkSyncProbe extends BaseProbe { constructor() { super(OpTag.P02_NETWORK_SYNC); } }export class P03CacheEvictProbe extends BaseProbe { constructor() { super(OpTag.P03_CACHE_EVICT); } }export class P04IdbAbortProbe extends BaseProbe { constructor() { super(OpTag.P04_IDB_ABORT); } }export class P05StateMutationProbe extends BaseProbe { constructor() { super(OpTag.P05_STATE_MUTATION); } }export class P06IndexMismatchProbe extends BaseProbe { constructor() { super(OpTag.P06_INDEX_MISMATCH); } }
// Gate A Infrastructure Probesexport class GateACookieFaultProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_COOKIE_FAULT); } }export class GateAMiddlewareLoopProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_MIDDLEWARE_LOOP); } }export class GateARlsViolationProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_RLS_VIOLATION); } }export class GateASessionTimeoutProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_SESSION_TIMEOUT); } }export class GateACallbackFailedProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_CALLBACK_FAILED); } }export class GateAHealthDegradedProbe extends BaseProbe { constructor() { super(OpTag.GATE_A_HEALTH_DEGRADED); } }
// Gate B Contribution Pipeline Probes (Pre-registered)export class GateBPaymentWebhookFailProbe extends BaseProbe { constructor() { super(OpTag.GATE_B_PAYMENT_WEBHOOK_FAIL); } }export class GateBLedgerMismatchProbe extends BaseProbe { constructor() { super(OpTag.GATE_B_LEDGER_MISMATCH); } }export class GateBFxOracleTimeoutProbe extends BaseProbe { constructor() { super(OpTag.GATE_B_FX_ORACLE_TIMEOUT); } }export class GateBIdempotencyLockProbe extends BaseProbe { constructor() { super(OpTag.GATE_B_IDEMPOTENCY_LOCK); } }