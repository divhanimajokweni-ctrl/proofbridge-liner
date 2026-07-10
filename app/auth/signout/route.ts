import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/server';

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
