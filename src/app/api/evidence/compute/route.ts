/**
 * POST /api/evidence/compute
 * --------------------------
 * Receives the live DMA calibration + the current replay step's observation
 * selection, runs the EIS v1.0 engine, and returns the verdict + audit
 * receipt hash.
 *
 * Body:
 *   {
 *     calibration: DMACalibration,
 *     includeField: boolean,
 *     includeAcoustic: boolean,
 *     includeContext: boolean,
 *     pumpStateChanged: boolean
 *   }
 *
 * Returns:
 *   {
 *     verdict: EISVerdict,            // (without the heavy observations array)
 *     pipeline: PipelinePass[],
 *     observations: CorrelatedObservation[],
 *     auditHash: string,              // SHA-256 of full canonical receipt body
 *     generatedAtUtc: string,
 *     classification: string
 *   }
 *
 * Uses the server-side z-ai-web-dev-sdk is NOT required here — this is pure
 * deterministic engineering computation. Reproducibility guarantee: same
 * input → same output (02c spec).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  computeEIS,
  buildPipeline,
  DEFAULT_CALIBRATION,
  type DMACalibration,
} from '@/lib/evidence/EISv1Engine';
import { serializeAudit, shortHash } from '@/lib/evidence/AuditSerializer';
import {
  buildObservationSet,
  DMA_ID,
} from '@/lib/evidence/hydraulicScenario';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ComputeBody {
  calibration?: Partial<DMACalibration>;
  includeField?: boolean;
  includeAcoustic?: boolean;
  includeContext?: boolean;
  includeAnomaly?: boolean;
  pumpStateChanged?: boolean;
}

export async function POST(req: NextRequest) {
  let body: ComputeBody;
  try {
    body = (await req.json()) as ComputeBody;
  } catch {
    body = {};
  }

  const calibration: DMACalibration = {
    ...DEFAULT_CALIBRATION,
    ...(body.calibration ?? {}),
  };

  // Clamp calibration parameters to documented ranges (02c)
  calibration.flowDeviationThresholdPct = clamp(
    calibration.flowDeviationThresholdPct, 1, 50,
  );
  calibration.pressureDropThresholdPct = clamp(
    calibration.pressureDropThresholdPct, 1, 30,
  );
  calibration.correlationTimeWindowMin = clamp(
    calibration.correlationTimeWindowMin, 1, 1440,
  );

  const observations = buildObservationSet({
    includeAnomaly: body.includeAnomaly ?? true,
    includeField: body.includeField ?? true,
    includeAcoustic: body.includeAcoustic ?? true,
    includeContext: body.includeContext ?? true,
    pumpStateChanged: body.pumpStateChanged ?? false,
  });

  const verdict = computeEIS(observations, calibration);
  const pipeline = buildPipeline(verdict, observations.length > 0);

  // Build + hash the full audit receipt (server-side Web Crypto).
  const receipt = await serializeAudit(verdict, observations, calibration, {
    dmaId: DMA_ID,
    classification: 'SIMULATION — NOT MUNICIPAL OPERATIONAL DATA',
  });

  // Strip the heavy observations array from the verdict for the wire response
  // (we send the verdict.observations separately with full classification detail).
  const { observations: _stripped, ...verdictLight } = verdict;

  return NextResponse.json({
    verdict: verdictLight,
    pipeline,
    observations: verdict.observations,
    auditHash: receipt.receiptHash,
    auditShortHash: shortHash(receipt.receiptHash),
    generatedAtUtc: receipt.generatedAtUtc,
    classification: receipt.classification,
    calibration,
    dmaId: DMA_ID,
  });
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
