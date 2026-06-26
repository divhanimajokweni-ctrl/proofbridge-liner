import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Missing JSON body');

    const identifier = String(body.identifier ?? '').trim();
    const mode = body.mode === 'company' ? 'company' : 'email';
    const rawJson = Boolean(body.rawJson);

    if (!identifier) return badRequest('"identifier" is required (email or company name).');

    const { spawn } = await import('node:child_process');
    const { spawnSync } = await import('node:child_process');

    const scriptPath = path.join(process.cwd(), 'scripts', 'customer-360', 'customer-360.mjs');
    const args = rawJson ? ['--json', `--${mode}`, identifier] : [`--${mode}`, identifier];

    const env = {
      ...process.env,
      INTERCOM_TOKEN: process.env.INTERCOM_TOKEN || '',
    };

    const child = spawnSync(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      env,
    });

    const stdout = child.stdout ?? '';
    const stderr = child.stderr ?? '';
    const code = child.status ?? 0;

    if (code !== 0) {
      return NextResponse.json(
        { error: 'customer-360 failed', detail: stderr || stdout || `exit ${code}` },
        { status: 502 }
      );
    }

    try {
      const parsed = JSON.parse(stdout);
      return NextResponse.json({ ok: true, profile: parsed });
    } catch {
      return NextResponse.json({ ok: true, markdown: stdout });
    }
  } catch (err) {
    console.error('[api/tools/customer-360] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
