import { NextRequest, NextResponse } from 'next/server';

interface NewsletterPayload {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NewsletterPayload = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store in database
    // 2. Send confirmation email
    // 3. Add to mailing list service
    // 4. Create audit log entry

    console.log('[VVU Newsletter Signup]', {
      timestamp: new Date().toISOString(),
      email: body.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Welcome to the VVU community. You will receive updates on our progress and programs.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VVU Newsletter Error]', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
