import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();
const ALLOWED_SENDERS = new Set(
  (process.env.ALLOWED_SENDERS || '').split(',').map((s) => s.trim()).filter(Boolean)
);

function runDispatcher(intent: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ `${WORKSPACE_ROOT}/scripts/agent-dispatcher.mjs`, intent ], {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env },
    }) as any;
    let out = '';
    let err = '';
    child.stdout?.on('data', (d: Buffer | string) => { out += d.toString(); });
    child.stderr?.on('data', (d: Buffer | string) => { err += d.toString(); });
    child.on('close', (code: number | null) => {
      if (code !== 0) reject(new Error(err || out || `exit ${code}`));
      else resolve(out.trim());
    });
    child.on('error', reject);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, text, timestamp } = body;

    if (!from || !text) {
      return NextResponse.json({ error: 'Missing required fields: from, text' }, { status: 400 });
    }

    if (ALLOWED_SENDERS.size > 0 && !ALLOWED_SENDERS.has(from)) {
      return NextResponse.json({ error: 'Unauthorized sender', blocked: true }, { status: 403 });
    }

    const intent = String(text).trim();
    if (!intent) return NextResponse.json({ error: 'Empty text' }, { status: 400 });

    const result = await runDispatcher(intent);
    const reply = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

    return NextResponse.json({ reply, from, timestamp: timestamp || new Date().toISOString(), mode: 'agent-routed' });
  } catch (err: unknown) {
    console.error('[whatsapp/handler] Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal handler error' }, { status: 500 });
  }
}
