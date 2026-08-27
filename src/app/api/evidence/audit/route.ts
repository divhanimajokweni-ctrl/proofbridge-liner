/**
 * POST /api/evidence/audit
 * ------------------------
 * Returns the full audit receipt JSON (with 11-field provenance per observation)
 * for download. Same body schema as /compute, but returns the entire receipt
 * so the user can save it as evidence_log.json (04a brief, Option 2 sandbox).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  computeEIS,
  DEFAULT_CALIBRATION,
  type DMACalibration,
} from '@/lib/evidence/EISv1Engine';
import { serializeAudit } from '@/lib/evidence/AuditSerializer';
import {
  buildObservationSet,
  DMA_ID,
} from '@/lib/evidence/hydraulicScenario';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuditBody {
  calibration?: Partial<DMACalibration>;
  includeField?: boolean;
  includeAcoustic?: boolean;
  includeContext?: boolean;
  includeAnomaly?: boolean;
  pumpStateChanged?: boolean;
}

export async function POST(req: NextRequest) {
  let body: AuditBody;
  try {
    body = (await req.json()) as AuditBody;
  } catch {
    body = {};
  }

  const calibration: DMACalibration = {
    ...DEFAULT_CALIBRATION,
    ...(body.calibration ?? {}),
  };

  const observations = buildObservationSet({
    includeAnomaly: body.includeAnomaly ?? true,
    includeField: body.includeField ?? true,
    includeAcoustic: body.includeAcoustic ?? true,
    includeContext: body.includeContext ?? true,
    pumpStateChanged: body.pumpStateChanged ?? false,
  });

  const verdict = computeEIS(observations, calibration);
  const receipt = await serializeAudit(verdict, observations, calibration, {
    dmaId: DMA_ID,
    classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  });

  return NextResponse.json(receipt, {
    headers: {
      'Content-Disposition': `attachment; filename="leak_candidate_audit_${DMA_ID}.json"`,
    },
  });
}
