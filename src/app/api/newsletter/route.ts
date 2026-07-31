import { NextResponse } from 'next/server';

/**
 * Newsletter subscription endpoint
 *
 * Accepts POST { email } from the footer newsletter form.
 * In production, this would forward to a mailing list service.
 * For now, it validates the input and returns a success response.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 },
      );
    }

    // In production: forward to Mailchimp / ConvertKit / etc.
    console.log('[newsletter] subscribed:', email);

    return NextResponse.json({
      message: 'Successfully subscribed to the VVU newsletter.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
