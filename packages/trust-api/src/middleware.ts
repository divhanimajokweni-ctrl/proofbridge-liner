// packages/trust-api/src/middleware.ts
// ───────────────────────────────────────────────────────────────
// Trust API Middleware
// Enforces Trust Context integrity and policy verification
// ───────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import type { 
  TrustContextManager,
  RiskEngine,
} from '@proofbridge/trust-runtime';
import type { 
  AgentTransactionRequest,
  VerificationResult 
} from '@proofbridge/trust-types';

export interface TrustApiMiddlewareConfig {
  contextManager: TrustContextManager;
  riskEngine: RiskEngine;
}

/**
 * Trust API Middleware Factory
 */
export function createTrustMiddleware(config: TrustApiMiddlewareConfig) {
  const { contextManager, riskEngine } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const contextId = req.headers['x-trust-context-id'] as string;

    if (!contextId) {
      return res.status(400).json({
        error: 'Missing x-trust-context-id header',
      });
    }

    const context = contextManager.getContext(contextId);
    if (!context) {
      return res.status(404).json({
        error: `Trust Context not found: ${contextId}`,
      });
    }

    if (context.status !== 'active') {
      return res.status(403).json({
        error: `Trust Context is ${context.status}`,
      });
    }

    // Attach context to request for downstream use
    (req as any).trustContext = context;
    
    next();
  };
}

/**
 * Verification Guard Middleware
 * Enforces the Risk Engine's verification policy
 */
export function createVerificationGuard(config: TrustApiMiddlewareConfig) {
  const { riskEngine } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    const transactionRequest = req.body as AgentTransactionRequest;

    if (!transactionRequest.agentId || !transactionRequest.targetContract) {
      return res.status(400).json({
        error: 'Invalid AgentTransactionRequest payload',
      });
    }

    const context = (req as any).trustContext;
    const result: VerificationResult = riskEngine.verifyRequest(
      transactionRequest,
      context.verificationPolicy
    );

    if (!result.allowed) {
      return res.status(403).json({
        error: 'Transaction rejected by Risk Engine',
        reason: result.reason,
        verification: result,
      });
    }

    // Attach verification result for receipt generation
    (req as any).verificationResult = result;

    next();
  };
}
