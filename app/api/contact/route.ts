import { NextResponse } from "next/server";

/**
 * Ubuntu Pools — Contact form endpoint
 *
 * Accepts POST { name, email, message } from the contact modal.
 * In production, this would forward to Resend / an email service.
 * For now, it validates the input and returns a success response.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // In production: forward to Resend / email service
    // await resend.emails.send({ from: ..., to: ..., subject: ..., text: ... });

    console.log("[contact] received:", { name, email, message: message.slice(0, 80) });

    return NextResponse.json({
      message: "Message received. We'll respond within 24 hours.",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
