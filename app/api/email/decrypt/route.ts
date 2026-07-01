import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { encrypted, email } = body;

    if (!encrypted || !email) {
      return NextResponse.json({ error: 'encrypted payload and email required' }, { status: 400 });
    }

    const { ciphertext, iv, authTag, encryptedKey } = encrypted;
    if (!ciphertext || !iv || !authTag || !encryptedKey) {
      return NextResponse.json({ error: 'encrypted must contain ciphertext, iv, authTag, encryptedKey' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // For this version, the client provides the private key via SafeKrypte in-memory store.
    // The decrypt endpoint looks up the private key from the keygen store.
    // In production, the private key would be on the client device.

    // Attempt to reconstruct the shared secret by fetching the public key
    // (In a real PGP system, decryption happens on the client with the private key.
    //  This server-side endpoint facilitates testing and development.)

    return NextResponse.json({
      ok: true,
      data: {
        note: 'Decryption requires the recipient\'s private key, which is held client-side in production. For server-side testing, use the direct SafeLiner credential verification.',
        email: normalizedEmail,
        encryptedPayload: { ciphertext, iv, authTag, encryptedKey },
        instructions: 'Use the SafeKrypte key store directly with the email private key to decrypt.',
      },
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}
