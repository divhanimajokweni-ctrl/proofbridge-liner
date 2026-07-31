// src/lib/evidence/envelope.ts
// ───────────────────────────────────────────────────────────────
// Epistemic Runtime — 8-Stage Execution Envelope
// Structured envelope that captures the full execution trace
// for cryptographic verification and third-party auditing.
// Adapted from proofbridge-liner: uses injected providers instead
// of Date.now(), crypto.randomUUID(), or Math.random().
// ───────────────────────────────────────────────────────────────

import type { ClockProvider, UuidProvider } from '@/lib/kernel/types';

// ─── Stage 1: Request ─────────────────────────────────────────

export interface RequestStage {
  prompt: string;
  tools: string[];
  model_hint?: string;
  cost_budget?: number;
  /** Numeric timestamp from injected clock (NOT Date) */
  timestamp: number;
}

// ─── Stage 2: Policy Decision ─────────────────────────────────

export interface PolicyDecisionStage {
  matched_policies: string[];
  decision: 'allow' | 'deny' | 'require_approval';
  denied_by?: string[];
  approval_required_by?: string[];
  policy_explanation: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ─── Stage 3: Model Selection ─────────────────────────────────

export interface ModelStage {
  model_id: string;
  provider: string;
  routing_reason: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ─── Stage 4: Tool Calls ──────────────────────────────────────

export interface ToolCallStage {
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration_ms: number;
  success: boolean;
  error?: string;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ─── Stage 5: Output ──────────────────────────────────────────

export interface OutputStage {
  text: string;
  structured_data?: Record<string, unknown>;
  tokens_used: {
    input: number;
    output: number;
  };
  cost_usd: number;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ─── Stage 6: Validation ──────────────────────────────────────

export interface ValidationStage {
  validation_score: number;
  validation_method: string;
  passed: boolean;
  validation_details: Record<string, unknown>;
  /** Numeric timestamp from injected clock */
  timestamp: number;
}

// ─── Unsigned Envelope (stages 1-6, no crypto) ────────────────

export interface UnsignedEnvelope {
  envelope_id: string;
  tenant_id: string;
  capability_id: string;
  agent_id?: string;
  goal_id?: string;

  request: RequestStage;
  policy_decision: PolicyDecisionStage;
  selected_model: ModelStage;
  tool_calls: ToolCallStage[];
  output: OutputStage;
  validation: ValidationStage;
}

// ─── Signed Envelope (full 8-stage) ───────────────────────────

export interface ExecutionEnvelope extends UnsignedEnvelope {
  envelope_hash: string;
  digital_signature: string;
  signing_key_id: string;
  /** Numeric timestamp from injected clock */
  created_at: number;
  /** Numeric timestamp from injected clock */
  signed_at: number;
}

// ─── Evidence Ledger Entry ────────────────────────────────────

export interface EvidenceLedgerEntry {
  action: string;
  evidence_type: string;
  value?: string;

  envelope?: ExecutionEnvelope;
  envelope_id?: string;

  is_cryptographically_verified: boolean;
  /** Numeric timestamp from injected clock */
  verification_timestamp?: number;

  /** Numeric timestamp from injected clock */
  created_at: number;
}

// ─── Provider Interface for Envelope Construction ─────────────

export interface EnvelopeProviders {
  clock: ClockProvider;
  uuid: UuidProvider;
}

// ─── Helper: Build an UnsignedEnvelope ────────────────────────

export function buildUnsignedEnvelope(
  params: {
    tenant_id: string;
    capability_id: string;
    agent_id?: string;
    goal_id?: string;
    prompt: string;
    tools?: string[];
    model_id?: string;
    provider?: string;
    routing_reason?: string;
    policy_decision?: Partial<PolicyDecisionStage>;
    output?: Partial<OutputStage>;
    validation?: Partial<ValidationStage>;
  },
  providers: EnvelopeProviders,
): UnsignedEnvelope {
  const now = providers.clock.now();
  const envelopeId = providers.uuid.generate();

  return {
    envelope_id: envelopeId,
    tenant_id: params.tenant_id,
    capability_id: params.capability_id,
    agent_id: params.agent_id,
    goal_id: params.goal_id,

    request: {
      prompt: params.prompt,
      tools: params.tools ?? [],
      timestamp: now,
    },

    policy_decision: {
      matched_policies: params.policy_decision?.matched_policies ?? [],
      decision: params.policy_decision?.decision ?? 'allow',
      denied_by: params.policy_decision?.denied_by,
      approval_required_by: params.policy_decision?.approval_required_by,
      policy_explanation: params.policy_decision?.policy_explanation ?? '',
      timestamp: now,
    },

    selected_model: {
      model_id: params.model_id ?? 'unknown',
      provider: params.provider ?? 'unknown',
      routing_reason: params.routing_reason ?? 'default',
      timestamp: now,
    },

    tool_calls: [],

    output: {
      text: params.output?.text ?? '',
      structured_data: params.output?.structured_data,
      tokens_used: params.output?.tokens_used ?? { input: 0, output: 0 },
      cost_usd: params.output?.cost_usd ?? 0,
      timestamp: now,
    },

    validation: {
      validation_score: params.validation?.validation_score ?? 1.0,
      validation_method: params.validation?.validation_method ?? 'default',
      passed: params.validation?.passed ?? true,
      validation_details: params.validation?.validation_details ?? {},
      timestamp: now,
    },
  };
}
