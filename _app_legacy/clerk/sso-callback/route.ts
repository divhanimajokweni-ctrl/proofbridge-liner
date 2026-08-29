import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  return NextResponse.redirect(
    `${origin}/clerk/sign-in?redirect=${encodeURIComponent(redirectTo)}`,
  );
}
