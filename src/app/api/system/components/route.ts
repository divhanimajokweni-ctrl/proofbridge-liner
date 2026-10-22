import { NextResponse } from 'next/server';
import { getSystemArchitecture } from '@/lib/system-components/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, architecture: getSystemArchitecture() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'COMPONENT_REGISTRY_ERROR';
    return NextResponse.json({ ok: false, status: 'BLOCKED', code }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
