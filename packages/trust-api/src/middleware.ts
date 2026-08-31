// packages/trust-api/src/middleware.ts
// Trust API Middleware
// Enforces Trust Context integrity and policy verification

export interface TrustApiMiddlewareConfig {
  contextManager: any;
  riskEngine: any;
}

export function createTrustMiddleware(config: TrustApiMiddlewareConfig) {
  const { contextManager, riskEngine } = config;

  return async (req: any, res: any, next: any) => {
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

    (req as any).trustContext = context;
    next();
  };
}

export function requireApiKey() {
  const expectedKey = process.env.TRUST_API_KEY;

  return (req: any, res: any, next: any) => {
    if (!expectedKey) {
      return res.status(503).json({
        error: 'Server misconfiguration: TRUST_API_KEY is not set',
      });
    }

    const providedKey = req.headers['x-trust-api-key'] as string | undefined;
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(401).json({
        error: 'Missing or invalid x-trust-api-key header',
      });
    }

    next();
  };
}

export function createVerificationGuard(config: TrustApiMiddlewareConfig) {
  const { riskEngine } = config;

  return async (req: any, res: any, next: any) => {
    const transactionRequest = req.body;

    if (!transactionRequest.agentId || !transactionRequest.targetContract) {
      return res.status(400).json({
        error: 'Invalid AgentTransactionRequest payload',
      });
    }

    const context = (req as any).trustContext;
    const result = riskEngine.verifyRequest(
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

    (req as any).verificationResult = result;
    next();
  };
}
