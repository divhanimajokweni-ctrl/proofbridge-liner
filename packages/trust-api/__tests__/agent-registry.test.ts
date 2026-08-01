import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAgent,
  getAgent,
  listAgents,
  updateAgent,
  isAgentRegistered,
  clearRegistry,
} from '../src/agent-registry';
import type { AgentIdentity } from '@proofbridge/trust-types';

function makeAgent(overrides: Partial<AgentIdentity> = {}): AgentIdentity {
  return {
    agentId: 'test/impl',
    displayName: 'Test Implementer',
    purpose: 'Implements approved plans into code',
    capabilities: ['code', 'tests'],
    restrictions: ['no-merge', 'no-deploy'],
    signingKeyRef: 'test-key-ref',
    registeredAt: Date.now(),
    ...overrides,
  };
}

describe('agent-registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers a new agent', async () => {
    const agent = makeAgent();
    await registerAgent(agent);
    const fetched = await getAgent('test/impl');
    expect(fetched).toEqual(agent);
  });

  it('rejects duplicate registration', async () => {
    await registerAgent(makeAgent());
    await expect(registerAgent(makeAgent())).rejects.toThrow('already registered');
  });

  it('returns null for unknown agent', async () => {
    const fetched = await getAgent('unknown');
    expect(fetched).toBeNull();
  });

  it('lists all agents', async () => {
    await registerAgent(makeAgent({ agentId: 'a/1' }));
    await registerAgent(makeAgent({ agentId: 'b/2' }));
    const all = await listAgents();
    expect(all).toHaveLength(2);
  });

  it('checks registration status', async () => {
    expect(isAgentRegistered('test/impl')).toBe(false);
    await registerAgent(makeAgent());
    expect(isAgentRegistered('test/impl')).toBe(true);
  });

  it('updates agent capabilities', async () => {
    await registerAgent(makeAgent());
    await updateAgent('test/impl', { capabilities: ['code', 'tests', 'docs'] });
    const agent = await getAgent('test/impl');
    expect(agent?.capabilities).toEqual(['code', 'tests', 'docs']);
  });

  it('throws on update of unknown agent', async () => {
    await expect(updateAgent('unknown', { displayName: 'X' })).rejects.toThrow('not registered');
  });

  it('preserves purpose on update (immutable)', async () => {
    await registerAgent(makeAgent());
    await updateAgent('test/impl', { displayName: 'New Name' });
    const agent = await getAgent('test/impl');
    expect(agent?.purpose).toBe('Implements approved plans into code');
    expect(agent?.displayName).toBe('New Name');
  });
});
