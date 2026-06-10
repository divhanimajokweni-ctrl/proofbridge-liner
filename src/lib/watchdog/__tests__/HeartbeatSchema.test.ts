import { OpTag, FaultPriority, classifyFault, FAULT_RULES } from '../HeartbeatSchema';

describe('HeartbeatSchema', () => {
  describe('OpTag enum', () => {
    it('should contain all operational tags', () => {
      expect(OpTag.P01_TAB_COORD).toBe('P01_TAB_COORD');
      expect(OpTag.P02_NETWORK_SYNC).toBe('P02_NETWORK_SYNC');
      expect(OpTag.P03_CACHE_EVICT).toBe('P03_CACHE_EVICT');
      expect(OpTag.P04_IDB_ABORT).toBe('P04_IDB_ABORT');
      expect(OpTag.P05_STATE_MUTATION).toBe('P05_STATE_MUTATION');
      expect(OpTag.P06_INDEX_MISMATCH).toBe('P06_INDEX_MISMATCH');

      expect(OpTag.GATE_A_COOKIE_FAULT).toBe('GATE_A_COOKIE_FAULT');
      expect(OpTag.GATE_A_MIDDLEWARE_LOOP).toBe('GATE_A_MIDDLEWARE_LOOP');
      expect(OpTag.GATE_A_RLS_VIOLATION).toBe('GATE_A_RLS_VIOLATION');
      expect(OpTag.GATE_A_SESSION_TIMEOUT).toBe('GATE_A_SESSION_TIMEOUT');
      expect(OpTag.GATE_A_CALLBACK_FAILED).toBe('GATE_A_CALLBACK_FAILED');
      expect(OpTag.GATE_A_HEALTH_DEGRADED).toBe('GATE_A_HEALTH_DEGRADED');

      expect(OpTag.GATE_B_PAYMENT_WEBHOOK_FAIL).toBe('GATE_B_PAYMENT_WEBHOOK_FAIL');
      expect(OpTag.GATE_B_LEDGER_MISMATCH).toBe('GATE_B_LEDGER_MISMATCH');
      expect(OpTag.GATE_B_FX_ORACLE_TIMEOUT).toBe('GATE_B_FX_ORACLE_TIMEOUT');
      expect(OpTag.GATE_B_IDEMPOTENCY_LOCK).toBe('GATE_B_IDEMPOTENCY_LOCK');

      expect(OpTag.UNKNOWN).toBe('UNKNOWN');
    });
  });

  describe('FAULT_RULES', () => {
    it('should have rules for all OpTags', () => {
      Object.values(OpTag).forEach(tag => {
        expect(FAULT_RULES[tag]).toBeDefined();
        expect(FAULT_RULES[tag]).toHaveProperty('keywords');
        expect(FAULT_RULES[tag]).toHaveProperty('priority');
        expect(FAULT_RULES[tag]).toHaveProperty('opHint');
      });
    });
  });

  describe('classifyFault', () => {
    it('should create incident with correct properties', () => {
      const incident = classifyFault(
        OpTag.GATE_A_COOKIE_FAULT,
        'cookies() call was not awaited',
        'Asynchronous server storage fault'
      );

      expect(incident).toHaveProperty('id');
      expect(incident.opTag).toBe(OpTag.GATE_A_COOKIE_FAULT);
      expect(incident.summary).toBe('Asynchronous server storage fault');
      expect(incident.errorLog).toBe('cookies() call was not awaited');
      expect(incident.opHint).toBe('Await Next.js cookies() wrapper explicitly in route handler.');
      expect(incident.priority).toBe('CRITICAL');
      expect(incident.specRef).toBe('vvu-spec-gate-a-cookie-fault');
      expect(incident.timestamp).toBeTypeOf('number');
    });

    it('should use UNKNOWN rule for undefined OpTag', () => {
      // This test demonstrates the fallback behavior
      const incident = classifyFault(
        // @ts-expect-error - testing invalid OpTag
        'INVALID_TAG' as unknown as OpTag,
        'Some error',
        'Test summary'
      );

      expect(incident.opTag).toBe(OpTag.UNKNOWN);
      expect(incident.priority).toBe('LOW');
      expect(incident.opHint).toBe('Review unclassified internal error stream metrics.');
    });
  });
});