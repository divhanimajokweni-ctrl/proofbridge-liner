import { NextRequest, NextResponse } from 'next/server';
import { validateTelemetry, TelemetryPayload } from '@/lib/vvu-telemetry';

export const runtime = 'nodejs';

// POST /api/vvu/telemetry
// Ingests an edge telemetry payload, validates it against SANS hydraulic
// invariants (Joukowsky celerity bounds) and APU thermal thresholds,
// then returns the classification result. Mirrors vvu-telemetry-controller.
export async function POST(req: NextRequest) {
  let body: TelemetryPayload;
  try {
    body = (await req.json()) as TelemetryPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (!body.nodeId || typeof body.flowRate !== 'number' || typeof body.apuTemperature !== 'number') {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: nodeId, flowRate, apuTemperature' },
      { status: 422 }
    );
  }

  const result = validateTelemetry(body);
  return NextResponse.json(
    { ...result, payload: body },
    { status: result.success ? 200 : 422 }
  );
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/vvu/telemetry',
    method: 'POST',
    schema: {
      nodeId: 'string',
      flowRate: 'number (L/s)',
      pressureHead: 'number (m)',
      acousticAbnormal: 'boolean',
      apuTemperature: 'number (°C)',
      tenantId: 'string (UUID)',
      timestamp: 'number (epoch ms)',
    },
    note: 'All writes are RLS-scoped to vvu.current_tenant_id session parameter.',
  });
}
