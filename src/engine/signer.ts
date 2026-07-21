// Epistemic Runtime v0.8 — Signer Provider
// Ed25519 signing via @noble/curves. No static credentials.

import type { SignerProvider } from '@/lib/kernel/types';
import { computeSHA256 } from '@/lib/kernel/hashing';
import { ed25519 } from '@noble/curves/ed25519.js';

export class Ed25519Signer implements SignerProvider {
  private privateKey: Uint8Array;
  private publicKeyCache: string | null = null;

  constructor(privateKeyHex: string) {
    // Convert hex to bytes
    this.privateKey = hexToBytes(privateKeyHex);
  }

  sign(canonicalBytes: string): string {
    // Synchronous Ed25519 signing using @noble/curves
    const messageBytes = new TextEncoder().encode(canonicalBytes);
    const signature = ed25519.sign(messageBytes, this.privateKey);
    return bytesToHex(signature);
  }

  verify(canonicalBytes: string, signature: string, publicKey: string): boolean {
    try {
      const messageBytes = new TextEncoder().encode(canonicalBytes);
      const signatureBytes = hexToBytes(signature);
      const publicKeyBytes = hexToBytes(publicKey);
      return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  getPublicKey(): string {
    if (this.publicKeyCache) return this.publicKeyCache;
    const pub = ed25519.getPublicKey(this.privateKey);
    this.publicKeyCache = bytesToHex(pub);
    return this.publicKeyCache;
  }

  getAlgorithm(): string {
    return 'Ed25519';
  }
}

export class HmacSigner implements SignerProvider {
  private secretKey: string;
  private publicKeyCache: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    this.publicKeyCache = computeSHA256(secretKey);
  }

  sign(canonicalBytes: string): string {
    // HMAC-SHA256 as a simpler signing alternative for development
    // Verification works because the verifier has the publicKey (= SHA256 of secretKey)
    // and can recompute: SHA256(publicKey + canonicalBytes) should match
    // So sign must produce: SHA256(publicKey + canonicalBytes) as well
    return computeSHA256(this.publicKeyCache + canonicalBytes);
  }

  verify(canonicalBytes: string, signature: string, publicKey: string): boolean {
    const expected = computeSHA256(publicKey + canonicalBytes);
    return expected === signature;
  }

  getPublicKey(): string {
    return this.publicKeyCache;
  }

  getAlgorithm(): string {
    return 'HMAC-SHA256';
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
