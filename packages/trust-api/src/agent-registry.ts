import type { AgentIdentity } from '@proofbridge/trust-types';

/**
 * Agent Registry — in-memory registry of registered agents.
 * Optional PostgreSQL backing via AgentRepository interface (same pattern as EventJournal).
 */

export interface AgentRepository {
  saveAgent(agent: AgentIdentity): Promise<void>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;
  getAllAgents(): Promise<AgentIdentity[]>;
  updateAgent(agentId: string, updates: Partial<AgentIdentity>): Promise<void>;
}

export interface AgentRegistryConfig {
  repository?: AgentRepository;
}

/**
 * In-memory agent store (singleton).
 */
const agents = new Map<string, AgentIdentity>();

/**
 * Register a new agent. One agent, one purpose.
 */
export async function registerAgent(
  identity: AgentIdentity,
  config?: AgentRegistryConfig
): Promise<void> {
  if (agents.has(identity.agentId)) {
    throw new Error(`Agent ${identity.agentId} already registered`);
  }

  agents.set(identity.agentId, identity);

  if (config?.repository) {
    await config.repository.saveAgent(identity);
  }
}

/**
 * Get a registered agent by ID.
 */
export async function getAgent(
  agentId: string,
  config?: AgentRegistryConfig
): Promise<AgentIdentity | null> {
  const agent = agents.get(agentId);
  if (agent) return agent;

  if (config?.repository) {
    return config.repository.getAgent(agentId);
  }

  return null;
}

/**
 * List all registered agents.
 */
export async function listAgents(
  config?: AgentRegistryConfig
): Promise<AgentIdentity[]> {
  if (config?.repository) {
    return config.repository.getAllAgents();
  }

  return Array.from(agents.values());
}

/**
 * Update an agent's registration.
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<Pick<AgentIdentity, 'displayName' | 'capabilities' | 'restrictions' | 'signingKeyRef'>>,
  config?: AgentRegistryConfig
): Promise<void> {
  const existing = agents.get(agentId);
  if (!existing) {
    throw new Error(`Agent ${agentId} not registered`);
  }

  const updated = { ...existing, ...updates };
  agents.set(agentId, updated);

  if (config?.repository) {
    await config.repository.updateAgent(agentId, updates);
  }
}

/**
 * Check if an agent is registered.
 */
export function isAgentRegistered(agentId: string): boolean {
  return agents.has(agentId);
}

/**
 * Clear all registered agents (for testing).
 */
export function clearRegistry(): void {
  agents.clear();
}
