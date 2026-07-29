import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  email: string;
  organization?: string;
  interest?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactPayload = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters.' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Store in database (Prisma)
    // 2. Send notification email
    // 3. Add to CRM system
    // 4. Create append-only audit log entry

    // For now, log the submission
    console.log('[VVU Contact Form]', {
      timestamp: new Date().toISOString(),
      name: body.name,
      email: body.email,
      organization: body.organization || 'N/A',
      interest: body.interest || 'General',
      messageLength: body.message.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your interest in Venture Vision Ubuntu. We will be in touch soon.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VVU Contact Form Error]', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
