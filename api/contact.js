/**
 * api/contact.js — Contact form endpoint using Resend
 *
 * POST /api/contact
 *
 * Requires RESEND_API_KEY environment variable.
 * Sends email via Resend SDK to hello@venturevisualubuntu.co.za.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL  = 'hello@venturevisualubuntu.co.za';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (_) { return res.status(400).json({ error: 'Invalid JSON body.' }); }

  const { name, email, message } = body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required.' });
  }

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: 'Fields cannot be empty.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — falling back to simulated send');
    return res.status(200).json({
      ok: true,
      message: 'Message received (email not sent — RESEND_API_KEY not configured).',
      note: 'Set RESEND_API_KEY environment variable to enable email delivery.',
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
      return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }

    return res.status(200).json({
      ok: true,
      message: 'Message sent. We\'ll be in touch within 24 hours.',
      id: data.id,
    });
  } catch (err) {
    console.error('Resend request failed:', err);
    return res.status(500).json({ error: 'Email service unavailable. Please try again later.' });
  }
}

export default handler;
