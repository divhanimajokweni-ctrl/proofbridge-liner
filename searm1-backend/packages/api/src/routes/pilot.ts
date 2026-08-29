// ─────────────────────────────────────────────────────────────
// /api/pilot — pilot proposal intake
// ─────────────────────────────────────────────────────────────
// Accepts a JSON body describing a prospective pilot site for
// SEARM1 deployment. Stores in `pilot_proposals` table.
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { run, query } from '../db';

const router = Router();

// POST / — submit a pilot proposal
router.post('/', (req: Request, res: Response) => {
  const b = req.body ?? {};
  const required = ['company', 'contact', 'email'];
  const missing = required.filter((k) => !b[k] || typeof b[k] !== 'string' || b[k].trim() === '');
  if (missing.length > 0) {
    res.status(400).json({
      error: 'validation failed',
      missing,
      message: 'company, contact, and email are required (non-empty strings).',
    });
    return;
  }

  // Basic email shape check (RFC-lite).
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(b.email)) {
    res.status(400).json({ error: 'invalid email', email: b.email });
    return;
  }

  const id = `PIL-${randomUUID()}`;
  const submittedAt = new Date().toISOString();

  run(
    `INSERT INTO pilot_proposals (
        id, company, contact, email, facility_type, current_method,
        pain_points, desired_outcomes, budget_range, timeline,
        scada_available, gis_available, dma_size, sensor_count,
        telemetry_interval, historical_incidents, submitted_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    b.company,
    b.contact,
    b.email,
    b.facility_type ?? null,
    b.current_method ?? null,
    b.pain_points ?? null,
    b.desired_outcomes ?? null,
    b.budget_range ?? null,
    b.timeline ?? null,
    b.scada_available ? 1 : 0,
    b.gis_available ? 1 : 0,
    b.dma_size ?? null,
    typeof b.sensor_count === 'number' ? b.sensor_count : null,
    typeof b.telemetry_interval === 'number' ? b.telemetry_interval : null,
    typeof b.historical_incidents === 'number' ? b.historical_incidents : null,
    submittedAt,
  );

  res.status(201).json({
    success: true,
    id,
    submittedAt,
    company: b.company,
    contact: b.contact,
    email: b.email,
  });
});

// GET / — list recent pilot proposals (admin/debug)
router.get('/', (req: Request, res: Response) => {
  const requested = parseInt(req.query.limit as string, 10);
  const limit = Number.isFinite(requested) ? Math.min(100, Math.max(1, requested)) : 20;
  const rows = query<{
    id: string;
    company: string;
    contact: string;
    email: string;
    facility_type: string | null;
    budget_range: string | null;
    submitted_at: string;
  }>(
    `SELECT id, company, contact, email, facility_type, budget_range, submitted_at
     FROM pilot_proposals
     ORDER BY submitted_at DESC
     LIMIT ?`,
    limit,
  );
  res.json({ proposals: rows, count: rows.length });
});

export default router;
