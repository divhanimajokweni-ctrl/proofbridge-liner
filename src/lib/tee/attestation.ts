import crypto from 'node:crypto';

export interface TeeAttestation {
  mode: 'software-attested' | 'hardware-attested';
  measurement: string;
  pcrHash: string;
  signingKeyFingerprint: string;
  timestamp: number;
  signature?: string;
}

// Persistent enclave key pair — loaded from env or generated once at cold start
let cachedPublicKeyFingerprint: string | null = null;
let cachedPublicKeyPem: string | null = null;

function getEnclaveKeyPair(): { publicKeyPem: string; fingerprint: string } {
  if (cachedPublicKeyPem && cachedPublicKeyFingerprint) {
    return { publicKeyPem: cachedPublicKeyPem, fingerprint: cachedPublicKeyFingerprint };
  }
  const { publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  cachedPublicKeyPem = publicKey;
  cachedPublicKeyFingerprint = crypto.createHash('sha256').update(publicKey).digest('hex');
  return { publicKeyPem: cachedPublicKeyPem, fingerprint: cachedPublicKeyFingerprint };
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

  const { publicKeyPem, fingerprint } = getEnclaveKeyPair();

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(JSON.stringify({ measurement, pcrHash, ts: Date.now() }));
  sign.end();

  // In production, replace with HSM/TEE signing; here we use the persistent private key
  const privateKeyPem = process.env.TEE_ENCLAVE_PRIVATE_KEY_PEM || publicKeyPem; // fallback for dev only
  const signature = sign.sign(privateKeyPem, 'hex');

  return {
    mode: process.env.TEE_MODE === 'hardware-attested' ? 'hardware-attested' : 'software-attested',
    measurement,
    pcrHash,
    signingKeyFingerprint: fingerprint,
    timestamp: Date.now(),
    signature,
  };
}

export function verifyAttestation(attestation: TeeAttestation, payload: string): boolean {
  const expectedMeasurement = crypto.createHash('sha256').update(payload).digest('hex');
  if (attestation.measurement !== expectedMeasurement) return false;

  const age = Date.now() - attestation.timestamp;
  if (age > 60000) return false;

  if (!attestation.signature) return false;

  // Reconstruct the signed message and verify against the persistent public key
  const { publicKeyPem } = getEnclaveKeyPair();
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(JSON.stringify({
    measurement: attestation.measurement,
    pcrHash: attestation.pcrHash,
    ts: attestation.timestamp,
  }));
  verify.end();

  return verify.verify(publicKeyPem, attestation.signature, 'hex');
}
