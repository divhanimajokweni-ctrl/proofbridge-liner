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

// Epistemic Runtime v0.8 — RSA-PSS-SHA256 Signer Module
// Phase K: Signer Providers

import type { SignerProvider } from '@/lib/kernel/types';
import { computeSHA256 } from '@/lib/kernel/hashing';

/**
 * RSA-PSS-SHA256 signer.
 * 
 * Uses Web Crypto API (SubtleCrypto) for RSA-PSS signing.
 * In Node.js environments, this uses the built-in crypto.subtle.
 * In browsers, this uses the native Web Crypto API.
 * 
 * No embedded keys. No hardcoded secrets.
 * Keys are injected via constructor.
 */
export class RSAPSSSigner implements SignerProvider {
  private privateKey: CryptoKey | null = null;
  private publicKeyCache: string | null = null;
  private privateKeyJwk: JsonWebKey | null = null;

  constructor(privateKeyJwk?: JsonWebKey) {
    if (privateKeyJwk) {
      this.privateKeyJwk = privateKeyJwk;
    }
  }

  /**
   * Initialize the signer by importing the private key.
   * Must be called before sign().
   */
  async init(): Promise<void> {
    if (!this.privateKeyJwk) return;
    
    this.privateKey = await crypto.subtle.importKey(
      'jwk',
      this.privateKeyJwk,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Derive public key for verification
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      { ...this.privateKeyJwk, d: undefined, p: undefined, q: undefined, dp: undefined, dq: undefined, qi: undefined },
      { name: 'RSA-PSS', hash: 'SHA-256' },
      true,
      ['verify'],
    );

    const exported = await crypto.subtle.exportKey('jwk', publicKey);
    this.publicKeyCache = computeSHA256(JSON.stringify(exported.n));
  }

  sign(canonicalBytes: string): string {
    if (!this.privateKey) {
      throw new Error('RSA-PSS signer not initialized. Call init() first.');
    }
    // Synchronous fallback for deterministic mode
    // Real RSA-PSS is async; this provides a deterministic SHA-256-based signature
    // for development/replay. Production must use async sign().
    return computeSHA256(`rsa-pss:${this.publicKeyCache}:${canonicalBytes}`);
  }

  async signAsync(canonicalBytes: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('RSA-PSS signer not initialized. Call init() first.');
    }
    const messageBytes = new TextEncoder().encode(canonicalBytes);
    const signature = await crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      this.privateKey,
      messageBytes,
    );
    return bytesToHex(new Uint8Array(signature));
  }

  verify(canonicalBytes: string, signature: string, publicKey: string): boolean {
    // Deterministic verification for development
    const expected = computeSHA256(`rsa-pss:${publicKey}:${canonicalBytes}`);
    return expected === signature;
  }

  getPublicKey(): string {
    return this.publicKeyCache ?? '';
  }

  getAlgorithm(): string {
    return 'RSA-PSS-SHA256';
  }

  /**
   * Generate a new RSA-PSS key pair.
   * Only for setup — never call inside deterministic kernel execution.
   */
  static async generateKeyPair(): Promise<{ privateKeyJwk: JsonWebKey; publicKeyJwk: JsonWebKey }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    );
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return { privateKeyJwk, publicKeyJwk };
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
