// packages/trust-api/src/routes.ts
// ───────────────────────────────────────────────────────────────
// Trust API Routes
// API endpoints for Trust Context lifecycle and operations
// ───────────────────────────────────────────────────────────────

import { Router, type Request, type Response } from 'express';
import type { 
  TrustContextManager,
  RiskEngine,
  ReceiptEngine,
} from '@proofbridge/trust-runtime';
import type { 
  CreateTrustContextRequest,
  JournalEventRequest,
  AgentTransactionRequest,
} from '@proofbridge/trust-types';
import { createTrustMiddleware, createVerificationGuard } from './middleware';

export interface TrustApiConfig {
  contextManager: TrustContextManager;
  riskEngine: RiskEngine;
  receiptEngine: ReceiptEngine;
}

export function createTrustRouter(config: TrustApiConfig): Router {
  const router = Router();
  const { contextManager, riskEngine, receiptEngine } = config;

  const trustMiddleware = createTrustMiddleware({ contextManager, riskEngine });
  const verificationGuard = createVerificationGuard({ contextManager, riskEngine });

  /**
   * POST /contexts
   * Create a new Trust Context
   */
  router.post('/contexts', async (req: Request, res: Response) => {
    try {
      const request = req.body as CreateTrustContextRequest;
      const result = await contextManager.createContext(request);
      
      // Generate configuration receipt
      const receipt = receiptEngine.generateConfigurationReceipt(
        result.context.contextId,
        result.context.trustAnchor,
        result.context.receiptRoot
      );

      res.status(201).json({
        ...result.response,
        receipt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /contexts/:id
   * Get Trust Context details
   */
  router.get('/contexts/:id', async (req: Request, res: Response) => {
    const context = contextManager.getContext(req.params.id as string);
    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }
    res.json(context);
  });

  /**
   * POST /journal
   * Journal a new event
   */
  router.post('/journal', trustMiddleware, async (req: Request, res: Response) => {
    try {
      const context = (req as any).trustContext;
      const request = req.body as JournalEventRequest;
      
      const journal = contextManager.getJournal(context.contextId);
      if (!journal) {
        return res.status(500).json({ error: 'Event Journal not initialized' });
      }

      const result = await journal.journalEvent(request);
      
      // Generate receipt
      const receipt = receiptEngine.generateEventJournalReceipt(
        context.contextId,
        result.event,
        result.chainLink.chainHash,
        [], // TODO: Merkle proof
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

  /**
   * POST /verify
   * Verify a transaction request
   */
  router.post('/verify', trustMiddleware, verificationGuard, async (req: Request, res: Response) => {
    try {
      const context = (req as any).trustContext;
      const transactionRequest = req.body as AgentTransactionRequest;
      const verificationResult = (req as any).verificationResult;

      // Generate verification receipt
      const receipt = receiptEngine.generateVerificationReceipt(
        context.contextId,
        transactionRequest.agentId,
        verificationResult.allowed ? 'approved' : 'rejected',
        verificationResult.reason || 'Verified by Risk Engine',
        context.receiptRoot,
        [], // TODO: Merkle proof
        verificationResult.latencyMs,
        verificationResult.riskScore
      );

      res.json({
        ...verificationResult,
        receipt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
