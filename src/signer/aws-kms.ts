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

// Epistemic Runtime v0.8 — AWS KMS Signer Module
// Phase K: Signer Providers — AWS KMS, IAM Federation, OIDC
//
// Production implementations using @aws-sdk/client-kms and
// @aws-sdk/client-sts. OIDC signer uses Web Crypto for
// HMAC-SHA256-based deterministic signing tied to OIDC identity.
//
// NOTE: These signers use async methods because KMS/STS operations are
// inherently asynchronous (network calls). The SignerProvider interface
// currently defines sync methods. Callers must await these methods.
// The interface should be updated to reflect async signatures.

import type { SignerProvider } from '@/lib/kernel/types';
import {
  KMSClient,
  SignCommand,
  VerifyCommand,
  GetPublicKeyCommand,
} from '@aws-sdk/client-kms';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a Uint8Array to a hex string. */
function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert a hex string to Uint8Array. */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${hex.length})`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Compute SHA-256 digest of a string and return as Uint8Array. */
async function sha256Digest(data: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(hash);
}

/**
 * Determine the KMS SigningAlgorithm based on the key spec returned
 * by GetPublicKey. RSA keys use RSASSA_PKCS1_V1_5_SHA_256;
 * ECC keys use ECDSA_SHA_256.
 */
function algorithmForKeySpec(keySpec: string): string {
  if (keySpec.startsWith('ECC_')) {
    return 'ECDSA_SHA_256';
  }
  // Default to RSA for RSA_* key specs
  return 'RSASSA_PKCS1_V1_5_SHA_256';
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Compares two hex strings character by character.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// AWSKMSSigner
// ---------------------------------------------------------------------------

/** AWS credential identity for passing to KMSClient. */
export interface AwsCredentialIdentity {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
}

export interface AWSKMSSignerConfig {
  keyArn: string;
  region?: string;
  credentials?: AwsCredentialIdentity;
}

/**
 * AWS KMS Signer.
 *
 * Uses AWS KMS for signing operations. Signs digests with the KMS key
 * identified by `keyArn`. The public key is cached after first retrieval.
 *
 * Methods are async because KMS operations require network calls.
 */
export class AWSKMSSigner implements SignerProvider {
  private readonly keyArn: string;
  private readonly kmsClient: KMSClient;
  private cachedPublicKey: string | null = null;
  private cachedSigningAlgorithm: string | null = null;

  constructor(config: AWSKMSSignerConfig) {
    this.keyArn = config.keyArn;

    const clientConfig: Record<string, unknown> = {};
    if (config.region) {
      clientConfig.region = config.region;
    }
    if (config.credentials) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
        sessionToken: config.credentials.sessionToken,
        expiration: config.credentials.expiration,
      };
    }
    this.kmsClient = new KMSClient(clientConfig as ConstructorParameters<typeof KMSClient>[0]);
  }

  /**
   * Sign canonical bytes by hashing them with SHA-256 and sending the
   * digest to KMS for signing.
   *
   * KeyId = constructor config keyArn
   * MessageType = 'DIGEST' (we pre-hash the message)
   * SigningAlgorithm = RSASSA_PKCS1_V1_5_SHA_256 (RSA) or ECDSA_SHA_256 (ECC)
   */
  async sign(canonicalBytes: string): Promise<string> {
    try {
      const digest = await sha256Digest(canonicalBytes);
      const signingAlgorithm = await this.resolveSigningAlgorithm();

      const command = new SignCommand({
        KeyId: this.keyArn,
        Message: digest,
        MessageType: 'DIGEST',
        SigningAlgorithm: signingAlgorithm,
      });

      const response = await this.kmsClient.send(command);

      if (!response.Signature) {
        throw new Error(
          `KMS Sign returned empty signature for key: ${this.keyArn}`
        );
      }

      // Signature is returned as Uint8Array — convert to hex
      return toHex(response.Signature as Uint8Array);
    } catch (error: unknown) {
      this.handleKMSError(error, 'sign');
    }
  }

  /**
   * Verify a signature against canonical bytes using KMS Verify.
   */
  async verify(
    canonicalBytes: string,
    signature: string,
    _publicKey: string
  ): Promise<boolean> {
    try {
      const digest = await sha256Digest(canonicalBytes);
      const signingAlgorithm = await this.resolveSigningAlgorithm();

      // Convert hex signature back to Uint8Array for KMS
      const sigBytes = hexToBytes(signature);

      const command = new VerifyCommand({
        KeyId: this.keyArn,
        Message: digest,
        MessageType: 'DIGEST',
        Signature: sigBytes,
        SigningAlgorithm: signingAlgorithm,
      });

      const response = await this.kmsClient.send(command);
      return response.SignatureValid === true;
    } catch (error: unknown) {
      this.handleKMSError(error, 'verify');
    }
  }

  /**
   * Retrieve the public key from KMS. Result is cached after first call.
   * Returns the DER-encoded public key as a hex string.
   */
  async getPublicKey(): Promise<string> {
    if (this.cachedPublicKey !== null) {
      return this.cachedPublicKey;
    }

    try {
      const command = new GetPublicKeyCommand({
        KeyId: this.keyArn,
      });

      const response = await this.kmsClient.send(command);

      if (!response.PublicKey) {
        throw new Error(
          `KMS GetPublicKey returned empty public key for: ${this.keyArn}`
        );
      }

      // Cache the signing algorithm based on key spec
      if (response.KeySpec) {
        this.cachedSigningAlgorithm = algorithmForKeySpec(response.KeySpec);
      }

      // PublicKey is a Uint8Array (DER-encoded) — convert to hex
      const publicKeyHex = toHex(response.PublicKey as Uint8Array);
      this.cachedPublicKey = publicKeyHex;
      return publicKeyHex;
    } catch (error: unknown) {
      this.handleKMSError(error, 'getPublicKey');
    }
  }

  getAlgorithm(): string {
    return 'AWS-KMS';
  }

  /**
   * Resolve the signing algorithm. If we haven't fetched it from
   * GetPublicKey yet, we do so now (which also caches the public key).
   */
  private async resolveSigningAlgorithm(): Promise<string> {
    if (this.cachedSigningAlgorithm) {
      return this.cachedSigningAlgorithm;
    }

    // Fetch public key which also caches the algorithm
    await this.getPublicKey();

    // Default fallback if KeySpec was not in the response
    return this.cachedSigningAlgorithm ?? 'RSASSA_PKCS1_V1_5_SHA_256';
  }

  /**
   * Handle KMS errors with context-rich messages.
   * This method always throws — it never returns.
   */
  private handleKMSError(error: unknown, operation: string): never {
    if (error && typeof error === 'object' && 'name' in error) {
      const awsError = error as { name: string; message?: string };

      if (awsError.name === 'NotFoundException') {
        throw new Error(
          `KMS key not found: ${this.keyArn}. ` +
            `Verify the key ARN is correct and exists in the configured region. ` +
            `Operation: ${operation}`
        );
      }

      if (awsError.name === 'AccessDeniedException') {
        const operationMap: Record<string, string> = {
          sign: 'Sign',
          verify: 'Verify',
          getPublicKey: 'GetPublicKey',
        };
        throw new Error(
          `Access denied for KMS operation '${operation}' on key: ${this.keyArn}. ` +
            `Ensure the IAM principal has kms:${operationMap[operation] ?? operation} permission. ` +
            `Check IAM policies and key policy for this key.`
        );
      }

      if (awsError.name === 'DisabledException') {
        throw new Error(
          `KMS key is disabled: ${this.keyArn}. Re-enable the key before signing.`
        );
      }

      if (awsError.name === 'KMSInvalidStateException') {
        throw new Error(
          `KMS key is in an invalid state for '${operation}': ${this.keyArn}. ` +
            `Key may be pending deletion. ${awsError.message ?? ''}`
        );
      }

      if (awsError.name === 'ValidationException') {
        throw new Error(
          `KMS validation error during '${operation}': ${awsError.message ?? 'Unknown validation error'}. ` +
            `Key: ${this.keyArn}`
        );
      }

      // Generic AWS error
      throw new Error(
        `KMS error during '${operation}': [${awsError.name}] ${awsError.message ?? 'Unknown error'}. ` +
          `Key: ${this.keyArn}`
      );
    }

    throw new Error(
      `Unexpected error during KMS '${operation}': ${error instanceof Error ? error.message : String(error)}. ` +
        `Key: ${this.keyArn}`
    );
  }
}

// ---------------------------------------------------------------------------
// IAMFederationSigner
// ---------------------------------------------------------------------------

export interface IAMFederationSignerConfig {
  roleArn: string;
  sessionName: string;
  keyArn: string;
  region?: string;
}

/** Cached assumed role credentials with expiry tracking. */
interface AssumedCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

/**
 * IAM Federation Signer.
 *
 * Uses AWS STS AssumeRole to obtain temporary credentials, then
 * delegates signing operations to an internal AWSKMSSigner created
 * with the assumed role's credentials.
 *
 * Credentials are cached and automatically refreshed when expired.
 */
export class IAMFederationSigner implements SignerProvider {
  private readonly roleArn: string;
  private readonly sessionName: string;
  private readonly keyArn: string;
  private readonly region: string | undefined;
  private readonly stsClient: STSClient;

  private assumedCredentials: AssumedCredentials | null = null;
  private kmsSigner: AWSKMSSigner | null = null;

  constructor(config: IAMFederationSignerConfig) {
    this.roleArn = config.roleArn;
    this.sessionName = config.sessionName;
    this.keyArn = config.keyArn;
    this.region = config.region;

    const stsConfig: Record<string, unknown> = {};
    if (config.region) {
      stsConfig.region = config.region;
    }
    this.stsClient = new STSClient(stsConfig as ConstructorParameters<typeof STSClient>[0]);
  }

  /**
   * Sign by delegating to the KMS signer. Ensures role is assumed
   * and credentials are valid before signing.
   */
  async sign(canonicalBytes: string): Promise<string> {
    await this.ensureAssumedRole();
    return this.kmsSigner!.sign(canonicalBytes);
  }

  /**
   * Verify by delegating to the KMS signer.
   */
  async verify(
    canonicalBytes: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    await this.ensureAssumedRole();
    return this.kmsSigner!.verify(canonicalBytes, signature, publicKey);
  }

  /**
   * Get public key by delegating to the KMS signer.
   */
  async getPublicKey(): Promise<string> {
    await this.ensureAssumedRole();
    return this.kmsSigner!.getPublicKey();
  }

  getAlgorithm(): string {
    return 'IAM-FEDERATION';
  }

  /**
   * Ensure we have valid assumed role credentials. If credentials
   * are expired or not yet obtained, perform AssumeRole.
   */
  private async ensureAssumedRole(): Promise<void> {
    if (
      this.assumedCredentials &&
      this.assumedCredentials.expiration > new Date()
    ) {
      // Credentials are still valid — KMS signer is already set up
      return;
    }

    try {
      const command = new AssumeRoleCommand({
        RoleArn: this.roleArn,
        RoleSessionName: this.sessionName,
      });

      const response = await this.stsClient.send(command);

      if (
        !response.Credentials ||
        !response.Credentials.AccessKeyId ||
        !response.Credentials.SecretAccessKey
      ) {
        throw new Error(
          `STS AssumeRole returned incomplete credentials for role: ${this.roleArn}`
        );
      }

      this.assumedCredentials = {
        accessKeyId: response.Credentials.AccessKeyId,
        secretAccessKey: response.Credentials.SecretAccessKey,
        sessionToken: response.Credentials.SessionToken ?? '',
        expiration: response.Credentials.Expiration ?? new Date(Date.now() + 3600_000),
      };

      // Create a new KMS signer with the assumed credentials
      this.kmsSigner = new AWSKMSSigner({
        keyArn: this.keyArn,
        region: this.region,
        credentials: {
          accessKeyId: this.assumedCredentials.accessKeyId,
          secretAccessKey: this.assumedCredentials.secretAccessKey,
          sessionToken: this.assumedCredentials.sessionToken,
          expiration: this.assumedCredentials.expiration,
        },
      });
    } catch (error: unknown) {
      this.handleSTSError(error);
    }
  }

  /**
   * Handle STS errors with context-rich messages.
   * This method always throws — it never returns.
   */
  private handleSTSError(error: unknown): never {
    if (error && typeof error === 'object' && 'name' in error) {
      const awsError = error as { name: string; message?: string };

      if (awsError.name === 'ExpiredToken') {
        // Clear cached credentials so next call re-assumes
        this.assumedCredentials = null;
        this.kmsSigner = null;
        throw new Error(
          `STS token expired for role: ${this.roleArn}. ` +
            `The token will be re-assumed on the next operation. ` +
            `If this persists, check the role's maximum session duration.`
        );
      }

      if (awsError.name === 'AccessDenied') {
        throw new Error(
          `STS AssumeRole access denied for role: ${this.roleArn}. ` +
            `Ensure the calling IAM principal has sts:AssumeRole permission ` +
            `and the trust policy allows this principal.`
        );
      }

      if (awsError.name === 'ValidationError') {
        throw new Error(
          `STS AssumeRole validation error: ${awsError.message ?? 'Unknown'}. ` +
            `Role: ${this.roleArn}, Session: ${this.sessionName}`
        );
      }

      throw new Error(
        `STS error during AssumeRole: [${awsError.name}] ${awsError.message ?? 'Unknown error'}. ` +
          `Role: ${this.roleArn}`
      );
    }

    throw new Error(
      `Unexpected error during STS AssumeRole: ${error instanceof Error ? error.message : String(error)}. ` +
        `Role: ${this.roleArn}`
    );
  }
}

// ---------------------------------------------------------------------------
// OIDCSigner
// ---------------------------------------------------------------------------

export interface OIDCSignerConfig {
  issuer: string;
  audience: string;
  oidcToken: string;
}

/**
 * OIDC Signer.
 *
 * Uses HMAC-SHA256 with the OIDC token as key material to produce
 * deterministic signatures tied to the OIDC identity. This provides
 * a consistent signing mechanism that is bound to the OIDC identity
 * without requiring a separate key management system.
 *
 * For full production use, integrate with an OIDC provider that
 * supports JWT signing (e.g., using the provider's JWKS endpoint
 * for verification). This implementation provides a deterministic
 * HMAC-based signature that is tied to the OIDC identity token.
 *
 * - sign: HMAC-SHA256(oidcToken, canonicalBytes) — deterministic
 *   signature tied to the OIDC identity
 * - verify: recomputes HMAC and compares in constant time
 * - getPublicKey: returns SHA-256 of issuer+audience as fingerprint
 */
export class OIDCSigner implements SignerProvider {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly oidcToken: string;
  private cachedPublicKey: string | null = null;

  constructor(config: OIDCSignerConfig) {
    this.issuer = config.issuer;
    this.audience = config.audience;
    this.oidcToken = config.oidcToken;
  }

  /**
   * Sign canonical bytes using HMAC-SHA256 with the OIDC token
   * as the key material. This produces a deterministic signature
   * tied to the OIDC identity.
   */
  async sign(canonicalBytes: string): Promise<string> {
    const key = await this.getHMACKey();
    const encoded = new TextEncoder().encode(canonicalBytes);
    const signature = await crypto.subtle.sign('HMAC', key, encoded);
    return toHex(new Uint8Array(signature));
  }

  /**
   * Verify a signature by recomputing the HMAC and comparing
   * in constant time.
   */
  async verify(
    canonicalBytes: string,
    signature: string,
    _publicKey: string
  ): Promise<boolean> {
    const expected = await this.sign(canonicalBytes);
    return constantTimeEqual(expected, signature);
  }

  /**
   * Return a fingerprint of this OIDC identity as SHA-256 of
   * issuer + audience. This serves as the "public key" identifier
   * for verification purposes.
   */
  async getPublicKey(): Promise<string> {
    if (this.cachedPublicKey !== null) {
      return this.cachedPublicKey;
    }

    const identity = `${this.issuer}:${this.audience}`;
    const encoded = new TextEncoder().encode(identity);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    this.cachedPublicKey = toHex(new Uint8Array(hash));
    return this.cachedPublicKey;
  }

  getAlgorithm(): string {
    return 'OIDC';
  }

  /**
   * Import the OIDC token as an HMAC key for Web Crypto operations.
   */
  private async getHMACKey(): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(this.oidcToken);
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
}
