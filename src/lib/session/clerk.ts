import { NextResponse } from 'next/server';
import { isClerkConfigured } from './clerk-config';

export { isClerkConfigured };

export async function getClerkSession(): Promise<{ userId: string; sessionId: string } | null> {
  if (!isClerkConfigured()) return null;
  try {
    const { auth } = await import('@clerk/nextjs/server');
    const session = await auth();
    if (!session?.userId) return null;
    return { userId: session.userId, sessionId: session.sessionId };
  } catch {
    return null;
  }
}

export function clerkFallbackRedirect(reqUrl: URL, redirectTo?: string): NextResponse {
  const clerkSignIn = new URL('/clerk/sign-in', reqUrl.origin);
  if (redirectTo) clerkSignIn.searchParams.set('redirect', redirectTo);
  return NextResponse.redirect(clerkSignIn);
}
