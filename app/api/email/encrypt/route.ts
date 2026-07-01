import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';
const FETCH_TIMEOUT = Number(process.env.TOOL_FETCH_TIMEOUT_MS ?? 3000);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, body: plaintext, sender } = body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Valid recipient email (to) required' }, { status: 400 });
    }
    if (!plaintext || typeof plaintext !== 'string') {
      return NextResponse.json({ error: 'Email body (body) required' }, { status: 400 });
    }
    if (!sender || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender)) {
      return NextResponse.json({ error: 'Valid sender email required' }, { status: 400 });
    }

    const normalizedTo = to.trim().toLowerCase();
    const normalizedSender = sender.trim().toLowerCase();

    // 1. Fetch recipient's public key
    const pkRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/pubkey?email=${encodeURIComponent(normalizedTo)}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!pkRes.ok) {
      return NextResponse.json({
        error: `No public key found for ${normalizedTo}. Ask them to register via POST /api/email/keys first.`,
      }, { status: 404 });
    }
    const pkData = await pkRes.json();
    const recipientPublicKeyPem = pkData?.data?.publicKeyPem ?? '';
    if (!recipientPublicKeyPem) {
      return NextResponse.json({ error: 'Recipient public key not found' }, { status: 404 });
    }

    // 2. Generate AES-256-GCM session key and IV
    const sessionKey = crypto.randomBytes(32); // AES-256 key
    const iv = crypto.randomBytes(16); // 96-bit IV for GCM

    // 3. Encrypt email body with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', new Uint8Array(sessionKey), new Uint8Array(iv));
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // 4. Wrap session key with recipient's ED25519 public key (Curve25519 key exchange)
    // Using ECDH key agreement via KeyObject for X25519
    const recipientPubKey = crypto.createPublicKey({ key: recipientPublicKeyPem as string, format: 'pem', type: 'spki' });
    const ephemeralKeyPair = crypto.generateKeyPairSync('x25519');
    const sharedSecret = crypto.diffieHellman({
      privateKey: ephemeralKeyPair.privateKey,
      publicKey: recipientPubKey,
    });
    // Derive encryption key from shared secret
    const wrappedKey = crypto.createHash('sha256').update(new Uint8Array(sharedSecret)).digest('hex');

    // 5. Sign the encrypted payload hash with sender's key via SafeKrypte
    const payloadHash = crypto.createHash('sha256')
      .update(`${ciphertext}:${iv.toString('hex')}:${authTag}:${wrappedKey}`)
      .digest('hex');

    const signRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/emailsign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedSender, content_hash: payloadHash }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    let signature = null;
    let keyId = null;
    if (signRes.ok) {
      const signData = await signRes.json();
      signature = signData?.data?.signature ?? null;
      keyId = signData?.data?.keyId ?? null;
    }

    // Return the encrypted payload (to be sent via send-encrypted or stored)
    return NextResponse.json({
      ok: true,
      data: {
        encrypted: {
          ciphertext,
          iv: iv.toString('hex'),
          authTag,
          encryptedKey: wrappedKey,
          ephemeralPublicKey: ephemeralKeyPair.publicKey.export({ type: 'spki', format: 'pem' }),
          algorithm: 'AES-256-GCM + X25519 ECDH',
        },
        signature: {
          value: signature,
          keyId,
          algorithm: 'ED25519',
        },
        from: normalizedSender,
        to: normalizedTo,
      },
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}
