/**
 * VVU OS — Audit Log Endpoint
 * GET /api/operatus/logs  → Read audit events from AUDIT-BUS
 * GET /api/operatus/logs?severity=ERROR&limit=10  → Filtered
 *
 * Also returns kernel scheduler logs and command history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Operatus } from '@/lib/kernel/vvu-operatus';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity') ?? '';
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    // Get AUDIT-BUS operator
    const auditBus = Operatus.getOperator('VVU-AUDIT-BUS');
    let auditLogs = null;
    if (auditBus) {
      const result = await auditBus.execute('read-log', { limit, severity });
      auditLogs = result.data;
    }

    return NextResponse.json({
      success: true,
      data: {
        auditLogs,
        commandHistory: Operatus.getCommandHistory().slice(-limit),
        systemStatus: Operatus.getStatus(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
