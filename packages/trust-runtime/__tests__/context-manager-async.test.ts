import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TrustContextManager,
  createTrustContextManager,
  type ContextRepository,
} from '../src/context-manager';
import type { EventRepository } from '../src/event-journal';
import type {
  TrustConfiguration,
  VerificationPolicy,
  CreateTrustContextRequest,
  TrustContextStatus,
} from '@proofbridge/trust-types';

function makeConfiguration(): TrustConfiguration {
  return {
    configurationId: 'cfg-1',
    configurationVersion: '1',
    policyDocumentHash: '0xabc',
    domainManifestHash: '0xdef',
    consumerApplication: 'ubuntu-pools',
    createdAt: Date.now(),
  };
}

function makePolicy(): VerificationPolicy {
  return {
    policyId: 'pol-1',
    policyVersion: '1',
    rules: [],
    circuitBreaker: {
      enabled: false,
      maxTransactionsPerMinute: 100,
      maxVolumePerWindow: 1000,
      windowHours: 24,
      killSwitchEnabled: false,
    },
  };
}

function makeCreateRequest(): CreateTrustContextRequest {
  return {
    configuration: makeConfiguration(),
    verificationPolicy: makePolicy(),
  };
}

function createMockContextRepository(): ContextRepository & { saved: any[]; statuses: Map<string, TrustContextStatus> } {
  const saved: any[] = [];
  const statuses = new Map<string, TrustContextStatus>();
  return {
    saved,
    statuses,
    saveContext: vi.fn(async (ctx: any) => { saved.push(ctx); }),
    getContext: vi.fn(async (id: string) => saved.find((c) => c.contextId === id)),
    updateStatus: vi.fn(async (id: string, status: TrustContextStatus) => { statuses.set(id, status); }),
    getAllContexts: vi.fn(async () => saved),
  };
}

function createMockEventRepository(): EventRepository {
  return {
    appendEvent: vi.fn(async () => {}),
    getEvents: vi.fn(async () => []),
    getLatestEvent: vi.fn(async () => undefined),
    verifyChainIntegrity: vi.fn(async () => ({ valid: true, breaks: [] })),
  };
}

describe('TrustContextManager', () => {
  describe('createContext', () => {
    it('persists + journals events', async () => {
      const ctxRepo = createMockContextRepository();
      const evtRepo = createMockEventRepository();

      const manager = createTrustContextManager({
        signingKey: 'test-key',
        contextRepository: ctxRepo,
        eventRepository: evtRepo,
        tenantId: 'tenant-1',
      });

      const result = await manager.createContext(makeCreateRequest());
      expect(result.context).toBeDefined();
      expect(result.context.contextId).toBeTruthy();
      expect(result.context.status).toBe('active');
      expect(result.response.trustAnchor).toBeTruthy();
      expect(result.journal).toBeDefined();

      expect(ctxRepo.saveContext).toHaveBeenCalledTimes(1);
    });

    it('creates in-memory when no repository', async () => {
      const manager = createTrustContextManager({ signingKey: 'key' });
      const result = await manager.createContext(makeCreateRequest());

      expect(result.context.contextId).toBeTruthy();
      expect(manager.getContext(result.context.contextId)).toBeDefined();
    });
  });

  describe('suspendContext', () => {
    it('persists + journals event', async () => {
      const ctxRepo = createMockContextRepository();
      const manager = createTrustContextManager({
        signingKey: 'key',
        contextRepository: ctxRepo,
      });

      const { context } = await manager.createContext(makeCreateRequest());
      const suspended = await manager.suspendContext(context.contextId, 'compliance issue');

      expect(suspended).toBeDefined();
      expect(suspended!.status).toBe('suspended');
      expect(ctxRepo.updateStatus).toHaveBeenCalledWith(context.contextId, 'suspended');
    });

    it('returns undefined for unknown context', async () => {
      const manager = createTrustContextManager({ signingKey: 'key' });
      const result = await manager.suspendContext('nonexistent', 'reason');
      expect(result).toBeUndefined();
    });
  });

  describe('freezeContext', () => {
    it('persists + journals event', async () => {
      const ctxRepo = createMockContextRepository();
      const manager = createTrustContextManager({
        signingKey: 'key',
        contextRepository: ctxRepo,
      });

      const { context } = await manager.createContext(makeCreateRequest());
      const frozen = await manager.freezeContext(context.contextId, 'security freeze');

      expect(frozen).toBeDefined();
      expect(frozen!.status).toBe('frozen');
      expect(ctxRepo.updateStatus).toHaveBeenCalledWith(context.contextId, 'frozen');
    });
  });

  describe('terminateContext', () => {
    it('persists + journals event', async () => {
      const ctxRepo = createMockContextRepository();
      const manager = createTrustContextManager({
        signingKey: 'key',
        contextRepository: ctxRepo,
      });

      const { context } = await manager.createContext(makeCreateRequest());
      const terminated = await manager.terminateContext(context.contextId, 'end of life');

      expect(terminated).toBeDefined();
      expect(terminated!.status).toBe('terminated');
      expect(ctxRepo.updateStatus).toHaveBeenCalledWith(context.contextId, 'terminated');
    });
  });

  describe('in-memory fallback', () => {
    it('falls back to in-memory when no repository', async () => {
      const manager = createTrustContextManager({ signingKey: 'key' });

      const { context } = await manager.createContext(makeCreateRequest());
      await manager.suspendContext(context.contextId, 'test');
      const ctx = manager.getContext(context.contextId);

      expect(ctx!.status).toBe('suspended');
    });

    it('getAllContexts returns all', async () => {
      const manager = createTrustContextManager({ signingKey: 'key' });
      await manager.createContext(makeCreateRequest());
      await manager.createContext(makeCreateRequest());
      expect(manager.getAllContexts()).toHaveLength(2);
    });

    it('getContextsByStatus filters correctly', async () => {
      const manager = createTrustContextManager({ signingKey: 'key' });
      const { context: ctx1 } = await manager.createContext(makeCreateRequest());
      await manager.createContext(makeCreateRequest());
      await manager.suspendContext(ctx1.contextId, 'suspend');

      expect(manager.getContextsByStatus('active')).toHaveLength(1);
      expect(manager.getContextsByStatus('suspended')).toHaveLength(1);
    });
  });
});
