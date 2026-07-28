import { NextResponse } from 'next/server';
import { VALIDATION_EVENT, RECIPIENTS } from '@/lib/validation-suite/data';

/**
 * VVU-VAL-001 Validation Suite API
 *
 * GET /api/validation-suite — Full validation event status
 * GET /api/validation-suite?phase=P1 — Specific phase detail
 * GET /api/validation-suite?milestones=true — Milestones only
 * GET /api/validation-suite?recipients=true — Recipient registry
 * GET /api/validation-suite?index=true — Validation Index dimensions only
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phaseId = url.searchParams.get('phase');
    const milestones = url.searchParams.get('milestones') === 'true';
    const recipients = url.searchParams.get('recipients') === 'true';
    const index = url.searchParams.get('index') === 'true';

    if (phaseId) {
      const phase = VALIDATION_EVENT.phases.find((p) => p.id === phaseId);
      if (!phase) {
        return NextResponse.json(
          { error: `Phase ${phaseId} not found. Valid IDs: P1-P7` },
          { status: 404 },
        );
      }
      return NextResponse.json({ phase });
    }

    if (milestones) {
      return NextResponse.json({ milestones: VALIDATION_EVENT.milestones });
    }

    if (recipients) {
      return NextResponse.json({ recipients: RECIPIENTS });
    }

    if (index) {
      return NextResponse.json({
        dimensions: VALIDATION_EVENT.validationIndexDimensions,
        passThreshold: VALIDATION_EVENT.passThreshold,
        formula: 'Index = Σ ( weightᵢ × dimensionᵢ ) weights sum to 1.0; each dimension 0–100',
      });
    }

    return NextResponse.json(VALIDATION_EVENT);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load validation suite data' },
      { status: 500 },
    );
  }
}
