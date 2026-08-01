/**
 * VVU OS — Scheduler Tick Endpoint
 * POST /api/operatus/tick  → Run one kernel scheduler cycle
 */

import { NextRequest, NextResponse } from 'next/server';
import { Operatus } from '@/lib/kernel/vvu-operatus';

export async function POST(_req: NextRequest) {
  try {
    const logs = Operatus.runSchedulerTick();
    return NextResponse.json({
      success: true,
      data: {
        logs,
        cycle: logs.length,
        timestamp: new Date().toISOString(),
      },
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
