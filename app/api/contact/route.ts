import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL  = 'hello@venturevisionubuntu.co.za';

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const { name, email, message } = body ?? {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'name, email, and message are required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json({
      ok: true,
      message: 'Message received (RESEND_API_KEY not configured).',
      note: 'Set RESEND_API_KEY env var to enable email delivery.',
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ubuntu Pools <onboarding@resend.dev>',
        to: [CONTACT_EMAIL],
        subject: `New contact from ${name} — via proofbridge-liner`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        reply_to: email,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend API error:', data);
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Message sent. We\'ll be in touch within 24 hours.', id: data.id });
  } catch (err) {
    console.error('Resend request failed:', err);
    return NextResponse.json({ error: 'Email service unavailable.' }, { status: 500 });
  }
}
