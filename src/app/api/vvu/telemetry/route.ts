import { NextRequest, NextResponse } from 'next/server';
import { validateTelemetry, TelemetryPayload } from '@/lib/vvu-telemetry';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GQEBERHA_TENANT_ID = 'e1002324-0000-0000-0000-000000000001';

// POST /api/vvu/telemetry
// Ingests an edge telemetry payload, validates it against SANS hydraulic
// invariants (Joukowsky celerity bounds) and APU thermal thresholds,
// persists to the RLS-scoped telemetry_logs table, then returns the result.
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

  if (
    !body.nodeId ||
    typeof body.flowRate !== 'number' ||
    typeof body.apuTemperature !== 'number'
  ) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: nodeId, flowRate, apuTemperature' },
      { status: 422 }
    );
  }

  const result = validateTelemetry(body);

  // Persist (even rejected ones, for audit — but mark invariantOk=false)
  try {
    const log = await db.telemetryLog.create({
      data: {
        tenantId: body.tenantId || GQEBERHA_TENANT_ID,
        nodeId: body.nodeId,
        flowRate: body.flowRate,
        pressureHead: body.pressureHead,
        acousticAbnormal: body.acousticAbnormal,
        apuTemperature: body.apuTemperature,
        systemState: result.state,
        estimatedCelerity: result.estimatedCelerity,
        invariantOk: result.invariantOk,
      },
    });
    return NextResponse.json(
      { ...result, logId: log.id, payload: body },
      { status: result.success ? 200 : 422 }
    );
  } catch (e) {
    // DB unavailable — fall back to in-memory result
    return NextResponse.json(
      { ...result, persisted: false, dbError: e instanceof Error ? e.message : 'Unknown' },
      { status: result.success ? 200 : 422 }
    );
  }
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
    note: 'All writes are RLS-scoped to vvu.current_tenant_id and persisted to telemetry_logs.',
  });
}
