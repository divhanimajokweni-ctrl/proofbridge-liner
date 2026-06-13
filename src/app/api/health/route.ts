/**
 * File: src/app/api/health/route.ts
 * Description: Remediated asynchronous cookie invocation wrapper and health reporter.
 */
import { NextResponse } from 'next/server';import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';import { cookies } from 'next/headers';import { GateACookieFaultProbe, GateAHealthDegradedProbe } from '@/lib/watchdog/WatchdogProbes';
export async function GET() {
  const checks: Record<string, boolean> = { database: false, auth: false };
  let cookieStore;

  // Gate A Remediation: cookies() call must be explicitly awaited
  try {
    cookieStore = await cookies();
  } catch (err: any) {
    new GateACookieFaultProbe().fire('Asynchronous server storage fault', err.message || '');
    return NextResponse.json({ status: 'DEGRADED', reason: 'ASYNC_COOKIE_FAULT' }, { status: 500 });
  }

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  try {
    const { data } = await supabase.auth.getSession();
    checks.auth = !!data;
  } catch {
    checks.auth = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  if (!allHealthy) {
    new GateAHealthDegradedProbe().fire('Infrastructure component degraded', JSON.stringify(checks));
  }

  return NextResponse.json(
    {
      status: allHealthy ? 'HEALTHY' : 'DEGRADED',
      version: '2.1.0',
      checks
    },
    { status: allHealthy ? 200 : 503 }
  );
}