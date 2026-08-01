import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationName, partnershipType, message } = body;

    if (!organizationName || !partnershipType || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationName, partnershipType, message' },
        { status: 400 }
      );
    }

    const validTypes = ['Integration', 'Research', 'Operations', 'Sponsorship'];
    if (!validTypes.includes(partnershipType)) {
      return NextResponse.json(
        { error: `Invalid partnershipType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Log the application (in production, this would persist to DB / send notification)
    console.log('[Partner Application]', {
      organizationName,
      partnershipType,
      message,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Partnership application received. We will review and reach out.',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
