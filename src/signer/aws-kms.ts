// Epistemic Runtime v0.8 — AWS KMS Signer Module
// Phase K: Signer Providers — AWS KMS, IAM Federation, OIDC
//
// CONTRACT: These are production signer interfaces. They require
// AWS SDK integration and valid credentials. Until integrated,
// all methods throw NOT_CONFIGURED errors rather than returning
// fake hashes (which could create a false sense of security).

import type { SignerProvider } from '@/lib/kernel/types';

/**
 * AWS KMS Signer.
 *
 * Uses AWS KMS for signing operations. No static credentials —
 * uses IAM role or OIDC federation.
 *
 * IMPORTANT: This signer is NOT functional without AWS SDK integration.
 * It throws on all operations to prevent silent security failures.
 */
export class AWSKMSSigner implements SignerProvider {
  private keyArn: string;

  constructor(config: { keyArn: string }) {
    this.keyArn = config.keyArn;
  }

  private notConfigured(): never {
    throw new Error(
      `AWSKMSSigner is not configured. ` +
      `Install @aws-sdk/client-kms and integrate with key ARN: ${this.keyArn}. ` +
      `For development, use HmacSigner instead.`
    );
  }

  sign(_canonicalBytes: string): string {
    // Production: Call KMS Sign API with the hash of canonicalBytes
    this.notConfigured();
  }

  verify(_canonicalBytes: string, _signature: string, _publicKey: string): boolean {
    // Production: Call KMS Verify API or verify locally with public key
    this.notConfigured();
  }

  getPublicKey(): string {
    // Production: Call KMS GetPublicKey API
    this.notConfigured();
  }

  getAlgorithm(): string {
    return 'AWS-KMS';
  }
}

/**
 * IAM Federation Signer.
 * Uses AWS IAM federation for identity-based signing.
 *
 * IMPORTANT: This signer is NOT functional without AWS SDK integration.
 */
export class IAMFederationSigner implements SignerProvider {
  private roleArn: string;
  private sessionName: string;

  constructor(config: { roleArn: string; sessionName: string }) {
    this.roleArn = config.roleArn;
    this.sessionName = config.sessionName;
  }

  private notConfigured(): never {
    throw new Error(
      `IAMFederationSigner is not configured. ` +
      `Install @aws-sdk/client-sts and integrate with role: ${this.roleArn}. ` +
      `For development, use HmacSigner instead.`
    );
  }

  sign(_canonicalBytes: string): string {
    this.notConfigured();
  }

  verify(_canonicalBytes: string, _signature: string, _publicKey: string): boolean {
    this.notConfigured();
  }

  getPublicKey(): string {
    this.notConfigured();
  }

  getAlgorithm(): string {
    return 'IAM-FEDERATION';
  }
}

/**
 * OIDC Signer.
 * Uses OIDC token-based signing.
 *
 * IMPORTANT: This signer is NOT functional without OIDC provider integration.
 */
export class OIDCSigner implements SignerProvider {
  private issuer: string;
  private audience: string;

  constructor(config: { issuer: string; audience: string }) {
    this.issuer = config.issuer;
    this.audience = config.audience;
  }

  private notConfigured(): never {
    throw new Error(
      `OIDCSigner is not configured. ` +
      `Integrate with OIDC provider: ${this.issuer} (audience: ${this.audience}). ` +
      `For development, use HmacSigner instead.`
    );
  }

  sign(_canonicalBytes: string): string {
    this.notConfigured();
  }

  verify(_canonicalBytes: string, _signature: string, _publicKey: string): boolean {
    this.notConfigured();
  }

  getPublicKey(): string {
    this.notConfigured();
  }

  getAlgorithm(): string {
    return 'OIDC';
  }
}
