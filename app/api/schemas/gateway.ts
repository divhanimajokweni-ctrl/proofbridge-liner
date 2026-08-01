import { z } from 'zod';

/**
 * /api/verify expects any of: documentHash, deed_hash, alpha, beta, gamma, threshold, signals
 * All optional fields carry sensible defaults matching the route's existing fallback logic.
 */
export const VerifyPayloadSchema = z.object({
  documentHash: z.string().length(66).optional(),
  deed_hash: z.string().length(66).optional(),
  signals: z.unknown().optional(),
  alpha: z.number().min(0).default(24),
  beta: z.number().min(0).default(8),
  gamma: z.number().min(0).default(1.0),
  threshold: z.number().min(0).max(1).default(0.55),
  // Gemma LLM judge fields (optional — used for secondary opinion in borderline zone)
  agentId: z.string().optional(),
  targetContract: z.string().optional(),
  valueETH: z.number().min(0).optional(),
  chronicleId: z.string().optional(),
});

/**
 * /api/mint expects { payload, signature }
 * HMAC verification is handled by the route, not the schema.
 */
export const MintPayloadSchema = z.object({
  payload: z.unknown(),
  signature: z.string().min(1, 'signature is required'),
});

export type VerifyPayload = z.infer<typeof VerifyPayloadSchema>;
export type MintPayload = z.infer<typeof MintPayloadSchema>;
