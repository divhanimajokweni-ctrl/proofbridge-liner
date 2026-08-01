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

// Epistemic Runtime v0.8 — Ed25519 Signer Module
// Phase K: Signer Providers

import type { SignerProvider } from '@/lib/kernel/types';
import { computeSHA256 } from '@/lib/kernel/hashing';
import { ed25519 } from '@noble/curves/ed25519.js';

/**
 * Ed25519 signer using @noble/curves.
 * Production-ready, deterministic, synchronous.
 */
export class Ed25519SignerModule implements SignerProvider {
  private privateKey: Uint8Array;
  private publicKeyCache: string | null = null;

  constructor(privateKeyHex: string) {
    this.privateKey = hexToBytes(privateKeyHex);
  }

  sign(canonicalBytes: string): string {
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

  /**
   * Generate a new Ed25519 key pair.
   * Only for setup — never call inside deterministic kernel execution.
   */
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
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
