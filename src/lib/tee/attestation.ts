import crypto from 'node:crypto';

export interface TeeAttestation {
  mode: 'software-attested';
  measurement: string;
  pcrHash: string;
  signingKeyFingerprint: string;
  timestamp: number;
}

export function generateAttestation(payload: string): TeeAttestation {
  const measurement = crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');

  const pcrHash = crypto
    .createHash('sha256')
    .update(measurement + String(Date.now()))
    .digest('hex');

  const signingKey = crypto.createSign('RSA-SHA256');
  const publicKey = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  }).publicKey;

  const fingerprint = crypto
    .createHash('sha256')
    .update(publicKey)
    .digest('hex');

  return {
    mode: 'software-attested',
    measurement,
    pcrHash,
    signingKeyFingerprint: fingerprint,
    timestamp: Date.now(),
  };
}

export function verifyAttestation(
  attestation: TeeAttestation,
  payload: string,
): boolean {
  const expectedMeasurement = crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');

  if (attestation.measurement !== expectedMeasurement) return false;

  const age = Date.now() - attestation.timestamp;
  if (age > 60000) return false;

  return true;
}
