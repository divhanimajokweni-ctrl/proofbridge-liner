/**
 * @license
 * VVU EARTH TECH - AIR Kernel
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

// Epistemic Runtime v0.8 — ECDSA P-384 Signer Module
// Phase K: Signer Providers

import type { SignerProvider } from '@/lib/kernel/types';
import { computeSHA256 } from '@/lib/kernel/hashing';
import { p384 } from '@noble/curves/p384.js';

/**
 * ECDSA P-384 signer using @noble/curves.
 * Production-ready, deterministic, synchronous.
 */
export class ECDSAP384Signer implements SignerProvider {
  private privateKey: Uint8Array;
  private publicKeyCache: string | null = null;

  constructor(privateKeyHex: string) {
    this.privateKey = hexToBytes(privateKeyHex);
  }

  sign(canonicalBytes: string): string {
    const messageBytes = new TextEncoder().encode(canonicalBytes);
    const signature = p384.sign(messageBytes, this.privateKey);
    return bytesToHex(signature.toDERRawBytes());
  }

  verify(canonicalBytes: string, signature: string, publicKey: string): boolean {
    try {
      const messageBytes = new TextEncoder().encode(canonicalBytes);
      const signatureBytes = hexToBytes(signature);
      const publicKeyBytes = hexToBytes(publicKey);
      return p384.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  getPublicKey(): string {
    if (this.publicKeyCache) return this.publicKeyCache;
    const pub = p384.getPublicKey(this.privateKey);
    this.publicKeyCache = bytesToHex(pub);
    return this.publicKeyCache;
  }

  getAlgorithm(): string {
    return 'ECDSA-P384';
  }

  /**
   * Generate a new ECDSA P-384 key pair.
   * Only for setup — never call inside deterministic kernel execution.
   */
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKey = p384.utils.randomPrivateKey();
    const publicKey = p384.getPublicKey(privateKey);
    return {
      privateKey: bytesToHex(privateKey),
      publicKey: bytesToHex(publicKey),
    };
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
