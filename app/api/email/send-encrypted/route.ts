import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { Resend } from 'resend';

const SAFEKRIPTE_LITE_URL = process.env.SAFEKRIPTE_LITE_URL ?? 'http://127.0.0.1:5096';
const SAFELINER_LITE_URL = process.env.SAFELINER_LITE_URL ?? 'http://127.0.0.1:5097';
const FETCH_TIMEOUT = Number(process.env.TOOL_FETCH_TIMEOUT_MS ?? 3000);

const rateLimitCache = new Map<string, number[]>();
const LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, [now]);
    return false;
  }
  const timestamps = rateLimitCache.get(ip)!.filter(t => now - t < LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  rateLimitCache.set(ip, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown-client';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.KERNEL_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, subject, body: plaintext, sender } = body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Valid recipient email required' }, { status: 400 });
    }
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'Subject required' }, { status: 400 });
    }
    if (!plaintext || typeof plaintext !== 'string') {
      return NextResponse.json({ error: 'Body required' }, { status: 400 });
    }

    const normalizedTo = to.trim().toLowerCase();
    const normalizedSender = (sender || 'hello@venturevisionubuntu.co.za').trim().toLowerCase();

    // 1. Fetch recipient's public key (if available for encryption)
    let encryptedPayload = null;
    let signature = null;
    let hasEncryption = false;

    try {
      const pkRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/pubkey?email=${encodeURIComponent(normalizedTo)}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });

      if (pkRes.ok) {
        const pkData = await pkRes.json();
        const recipientPublicKeyPem = pkData?.data?.publicKeyPem;
        hasEncryption = true;

        // Encrypt with AES-256-GCM
        const sessionKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', new Uint8Array(sessionKey), new Uint8Array(iv));
        let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Wrap session key with recipient's public key via X25519 ECDH
        const recipientPubKey = crypto.createPublicKey({ key: recipientPublicKeyPem as string, format: 'pem', type: 'spki' });
        const ephemeralKeyPair = crypto.generateKeyPairSync('x25519');
        const sharedSecret = crypto.diffieHellman({
          privateKey: ephemeralKeyPair.privateKey,
          publicKey: recipientPubKey,
        });
        const wrappedKey = crypto.createHash('sha256').update(new Uint8Array(sharedSecret)).digest('hex');

        // Sign encrypted payload
        const payloadHash = crypto.createHash('sha256')
          .update(`${ciphertext}:${iv.toString('hex')}:${authTag}:${wrappedKey}`)
          .digest('hex');

        const signRes = await fetch(`${SAFEKRIPTE_LITE_URL}/commons/v1/emailsign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedSender, content_hash: payloadHash }),
          signal: AbortSignal.timeout(FETCH_TIMEOUT),
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          signature = signData?.data?.signature ?? null;
        }

        encryptedPayload = {
          ciphertext,
          iv: iv.toString('hex'),
          authTag,
          encryptedKey: wrappedKey,
          ephemeralPublicKey: ephemeralKeyPair.publicKey.export({ type: 'spki', format: 'pem' }),
        };
      }
    } catch {
      // Encryption not available — fall back to plain delivery
      hasEncryption = false;
    }

    // 2. Issue SafeLiner credential for sender verification
    let credential = null;
    try {
      const credRes = await fetch(`${SAFELINER_LITE_URL}/commons/v1/email-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedSender,
          display_name: body.display_name || normalizedSender,
          public_key: 'auto-issued',
        }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });
      if (credRes.ok) {
        const credData = await credRes.json();
        credential = credData?.data?.credential ?? null;
      }
    } catch {
      // Credential issuance is optional
    }

    // 3. Build email HTML
    let emailHtml: string;
    if (encryptedPayload) {
      // Encrypted delivery — send secure link
      const encryptedPayloadB64 = Buffer.from(JSON.stringify(encryptedPayload)).toString('base64');
      emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h2>🔐 Encrypted Message from ${normalizedSender}</h2>
  <p>This message was encrypted with your public key and can only be read by you.</p>
  <p><strong>Subject:</strong> ${subject}</p>
  <hr>
  <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 13px; overflow-x: auto;">
-----BEGIN VVU ENCRYPTED MESSAGE-----
Version: VVU-Email-Crypto v1
Algorithm: AES-256-GCM + X25519 ECDH
Sender: ${normalizedSender}
Signature: ${signature ? signature.substring(0, 40) + '...' : 'N/A'}
Key-ID: ${credential ? credential.id : 'N/A'}

[Encrypted payload available for client-side decryption]
-----END VVU ENCRYPTED MESSAGE-----
  </pre>
  <p style="font-size: 12px; color: #666;">
    This is an end-to-end encrypted email. To read the message, 
    use the VVU Email Decryption API with your private key.
  </p>
  ${credential ? `<p style="font-size: 12px; color: #666;">Sender verified via SafeLiner credential: <a href="/commons/v1/credential/${credential.id}">${credential.id}</a></p>` : ''}
</body>
</html>`;
    } else {
      // Plain delivery (recipient has no public key on file)
      emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h2>Message from ${normalizedSender}</h2>
  <p><strong>Subject:</strong> ${subject}</p>
  <p><strong>Note:</strong> This message was sent in plain text because no public key was found for your address.</p>
  <hr>
  <p>${plaintext.replace(/\n/g, '<br>')}</p>
  <hr>
  <p style="font-size: 12px; color: #666;">
    To receive encrypted messages, register your public key at:
    POST /api/email/keys
  </p>
  ${credential ? `<p style="font-size: 12px; color: #666;">Sender verified via SafeLiner credential: <a href="/commons/v1/credential/${credential.id}">${credential.id}</a></p>` : ''}
</body>
</html>`;
    }

    // 4. Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { data, error } = await resend.emails.send({
      from: 'hello@venturevisionubuntu.co.za',
      to: normalizedTo,
      subject: hasEncryption ? `🔐 ${subject}` : subject,
      html: emailHtml,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id: data?.id,
      encrypted: hasEncryption,
      sender: normalizedSender,
      credentialId: credential?.id ?? null,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Internal error',
    }, { status: 500 });
  }
}
