import { z } from 'zod';

/** Stable extension contract. Components are registered by manifest, never by arbitrary runtime code. */
export const ComponentLayer = z.enum([
  'evidence', 'eis', 'cryptography', 'operations', 'underwriting',
  'policy', 'execution', 'application', 'orchestration', 'presentation', 'observability'
]);
export type ComponentLayer = z.infer<typeof ComponentLayer>;

export const ComponentStatus = z.enum(['planned', 'registered', 'healthy', 'degraded', 'blocked', 'retired']);
export type ComponentStatus = z.infer<typeof ComponentStatus>;

export const ComponentManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/),
  title: z.string().min(1),
  layer: ComponentLayer,
  description: z.string().min(1),
  requires: z.array(z.string()).default([]),
  provides: z.array(z.string()).default([]),
  capabilities: z.array(z.enum([
    'read-evidence', 'write-evidence', 'verify-signatures', 'evaluate-policy',
    'issue-coverage', 'authorize-execution', 'execute-value-transfer',
    'render-ui', 'emit-telemetry', 'administer-components'
  ])).default([]),
  trustBoundary: z.string().min(1),
  failMode: z.enum(['closed', 'read-only', 'isolated']).default('closed'),
  status: ComponentStatus.default('registered'),
  entrypoint: z.string().optional(),
  owner: z.string().optional(),
}).strict();
export type ComponentManifest = z.infer<typeof ComponentManifestSchema>;

export const SystemEventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  schemaVersion: z.string().min(1),
  occurredAt: z.string().datetime(),
  producer: z.string().min(1),
  correlationId: z.string().min(1),
  causationId: z.string().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  payloadDigest: z.string().min(1),
}).strict();
export type SystemEvent = z.infer<typeof SystemEventSchema>;

export interface ComponentHealth {
  componentId: string;
  status: ComponentStatus;
  checkedAt: string;
  checks: Array<{ id: string; passed: boolean; detailCode: string }>;
}

export interface VerificationDecision {
  decision: 'PASS' | 'BLOCK' | 'INCONCLUSIVE';
  gate: string;
  reasonCodes: string[];
  evidenceRefs: string[];
  executionAuthorized: false;
}
