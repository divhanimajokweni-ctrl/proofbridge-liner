import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET =
  process.env.VVU_JWT_SECRET ||
  'vvu_brain_absolute_cryptographic_signing_key_vector';

const COMPLIANCE_PIN_HASH = crypto
  .createHash('sha256')
  .update('9876')
  .digest('hex');

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: 'Access PIN parameter required.' },
        { status: 400 }
      );
    }

    const clientHash = crypto
      .createHash('sha256')
      .update(pin)
      .digest('hex');

    const clientBuf = Buffer.from(clientHash, 'hex');
    const pinBuf = Buffer.from(COMPLIANCE_PIN_HASH, 'hex');
    const isVerified =
      clientBuf.length === pinBuf.length &&
      crypto.timingSafeEqual(
        new Uint8Array(clientBuf),
        new Uint8Array(pinBuf)
      );

    if (!isVerified) {
      return NextResponse.json(
        { error: 'Access Denied: Invalid Security Hash.' },
        { status: 401 }
      );
    }

    const sessionToken = jwt.sign(
      {
        identity: 'WAR_ROOM_OPERATOR',
        permissions: ['READ_CHRONICLE', 'PROVISION_TOKEN'],
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const response = NextResponse.json({
      success: true,
      redirect: '/dashboard',
    });

    response.cookies.set('vvu_session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7200,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication Pipeline Interruption' },
      { status: 500 }
    );
  }
}
