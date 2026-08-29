// ─────────────────────────────────────────────────────────────
// /api/events — evidence event read endpoints
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';

const router = Router();

interface EvidenceEventRow {
  id: string;
  asset_id: string;
  event_type: string;
  confidence: number;
  classification: string;
  evidence: string;
  created_at: string;
}

function parseRow(r: EvidenceEventRow) {
  return {
    id: r.id,
    assetId: r.asset_id,
    eventType: r.event_type,
    confidence: r.confidence,
    classification: r.classification,
    evidence: r.evidence ? JSON.parse(r.evidence) : null,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// GET /latest — return the most recent evidence event
router.get('/latest', (_req: Request, res: Response) => {
  const row = queryOne<EvidenceEventRow>(
    `SELECT id, asset_id, event_type, confidence, classification, evidence, created_at
     FROM evidence_events
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
  );
  if (!row) {
    res.status(404).json({ error: 'no evidence events yet', hint: 'POST /api/simulator/leak to generate one' });
    return;
  }
  res.json(parseRow(row));
});

// GET /history — return last N evidence events (default 20, max 100)
router.get('/history', (req: Request, res: Response) => {
  const requested = parseInt(req.query.limit as string, 10);
  const limit = Number.isFinite(requested) ? Math.min(100, Math.max(1, requested)) : 20;

  const rows = query<EvidenceEventRow>(
    `SELECT id, asset_id, event_type, confidence, classification, evidence, created_at
     FROM evidence_events
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    limit,
  );
  res.json({ events: rows.map(parseRow), count: rows.length, limit });
});

export default router;
