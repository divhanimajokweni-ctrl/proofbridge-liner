/**
 * VVU OS — Operatus Control Surface
 *
 * GET  /api/operatus         → Full system status
 * POST /api/operatus         → Execute a command
 *
 * This is the primary API surface that the War Room gateway
 * and Obsidian plugin connect to for real-time system control.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Operatus } from '@/lib/kernel/vvu-operatus';

export async function GET() {
  try {
    const status = Operatus.getStatus();
    return NextResponse.json({
      success: true,
      data: status,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target, command, args } = body;

    if (!target || !command) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: target, command',
        },
        { status: 400 }
      );
    }

    const result = await Operatus.execute({ target, command, args });

    return NextResponse.json({
      success: result.success,
      data: result,
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
