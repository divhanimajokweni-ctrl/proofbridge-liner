/**
 * VVU OS — Panic / Reboot Endpoint
 * POST /api/operatus/panic  → Trigger kernel panic
 * POST /api/operatus/panic?reboot=true  → Reboot the kernel
 */

import { NextRequest, NextResponse } from 'next/server';
import { Operatus } from '@/lib/kernel/vvu-operatus';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isReboot = searchParams.get('reboot') === 'true';

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // No body — that's fine for panic
    }

    if (isReboot) {
      await Operatus.reboot();
      return NextResponse.json({
        success: true,
        data: {
          action: 'REBOOT',
          timestamp: new Date().toISOString(),
          message: 'Kernel cold-boot reset complete. All operators reinitialized.',
        },
      });
    }

    const reason = String(body?.reason ?? 'Manual panic from War Room');
    Operatus.panic(reason);

    return NextResponse.json({
      success: true,
      data: {
        action: 'PANIC',
        reason,
        timestamp: new Date().toISOString(),
        message: `Kernel panicked: ${reason}`,
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
