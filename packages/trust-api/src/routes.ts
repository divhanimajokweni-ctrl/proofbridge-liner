// packages/trust-api/src/routes.ts
// Trust API Routes — all endpoints now authenticated

import { Router } from 'express';
import { createTrustMiddleware, createVerificationGuard, requireApiKey } from './middleware';

export interface TrustApiConfig {
  contextManager: any;
  riskEngine: any;
  receiptEngine: any;
}

export function createTrustRouter(config: TrustApiConfig): Router {
  const router = Router();
  const { contextManager, riskEngine, receiptEngine } = config;

  const trustMiddleware = createTrustMiddleware({ contextManager, riskEngine });
  const verificationGuard = createVerificationGuard({ contextManager, riskEngine });
  const apiKeyGuard = requireApiKey();

  // POST /contexts — gated by API key (no context exists yet)
  router.post('/contexts', apiKeyGuard, async (req: any, res: any) => {
    try {
      const result = await contextManager.createContext(req.body);
      const receipt = receiptEngine.generateConfigurationReceipt(
        result.context.contextId,
        result.context.trustAnchor,
        result.context.receiptRoot
      );
      res.status(201).json({ ...result.response, receipt });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // GET /contexts/:id — authenticated via x-trust-context-id
  router.get('/contexts/:id', trustMiddleware, async (req: any, res: any) => {
    const authenticatedContext = (req as any).trustContext;
    if (authenticatedContext.contextId !== req.params.id) {
      return res.status(403).json({
        error: 'x-trust-context-id does not match requested context',
      });
    }
    const context = contextManager.getContext(req.params.id);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }
    res.json(context);
  });

  // POST /journal — authenticated
  router.post('/journal', trustMiddleware, async (req: any, res: any) => {
    try {
      const context = (req as any).trustContext;
      const journal = contextManager.getJournal(context.contextId);
      if (!journal) {
        return res.status(500).json({ error: 'Event Journal not initialized' });
      }
      const result = await journal.journalEvent(req.body);
      const receipt = receiptEngine.generateEventJournalReceipt(
        context.contextId,
        result.event,
        result.chainLink.chainHash,
        [],
        0
      );
      res.status(201).json({
        event: result.event,
        chainLink: result.chainLink,
        receipt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // POST /verify — authenticated + verification guard
  router.post('/verify', trustMiddleware, verificationGuard, async (req: any, res: any) => {
    try {
      const context = (req as any).trustContext;
      const verificationResult = (req as any).verificationResult;
      const receipt = receiptEngine.generateVerificationReceipt(
        context.contextId,
        req.body.agentId,
        verificationResult.allowed ? 'approved' : 'rejected',
        verificationResult.reason || 'Verified by Risk Engine',
        context.receiptRoot,
        [],
        verificationResult.latencyMs,
        verificationResult.riskScore
      );
      res.json({ ...verificationResult, receipt });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
