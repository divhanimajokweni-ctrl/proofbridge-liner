import { NextResponse } from 'next/server';
import { isClerkConfigured } from '@/lib/session/clerk-config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectedFrom = searchParams.get('redirectedFrom');
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  if (!isClerkConfigured()) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (redirectedFrom) {
    return NextResponse.redirect(`${origin}${redirectedFrom}`);
  }

  return NextResponse.redirect(`${origin}/clerk/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
}
