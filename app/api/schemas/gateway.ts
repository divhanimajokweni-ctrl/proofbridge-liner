import { z } from 'zod';

/**
 * /api/verify expects any of: documentHash, deed_hash, alpha, beta, gamma, threshold, signals
 * These are all optional — the route has fallback defaults.
 */
export const VerifyPayloadSchema = z.object({
  documentHash: z.string().length(66).optional(),
  deed_hash: z.string().length(66).optional(),
  signals: z.unknown().optional(),
  alpha: z.number().min(0).optional(),
  beta: z.number().min(0).optional(),
  gamma: z.number().min(0).optional(),
  threshold: z.number().min(0).max(1).optional(),
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
