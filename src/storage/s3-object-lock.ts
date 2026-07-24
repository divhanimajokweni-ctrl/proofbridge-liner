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

// Epistemic Runtime v0.8 — S3 Object Lock Driver
// Production: S3 Object Lock for immutable evidence storage.
//
// CONTRACT: This is a production driver interface. Requires AWS SDK integration
// and is only functional with valid AWS credentials and a bucket
// configured with Object Lock in COMPLIANCE mode.
//
// PRODUCTION SETUP:
// 1. Create an S3 bucket with Object Lock enabled
// 2. Set default retention to COMPLIANCE mode (cannot be overridden)
// 3. Configure IAM role with s3:PutObject, s3:GetObject, s3:ListBucket, s3:HeadBucket
// 4. Pass bucket config to constructor

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';

import type { Fact, Proof, Projection, StorageProvider } from '@/lib/kernel/types';

/** Configuration for S3ObjectLockStorage */
export interface S3ObjectLockStorageConfig {
  /** S3 bucket name (must have Object Lock enabled) */
  bucket: string;
  /** Key prefix for all objects in this store */
  prefix: string;
  /** AWS region */
  region: string;
  /** Optional AWS credentials — if omitted, IAM role / environment credentials are used */
  credentials?: S3ClientConfig['credentials'];
}

/** S3 error code constants */
const NO_SUCH_KEY = 'NoSuchKey';
const NOT_FOUND = 'NotFound';
const ACCESS_DENIED = 'AccessDenied';
const ALL_ACCESS_DISABLED = 'AllAccessDisabled';

/**
 * S3 Object Lock storage driver.
 *
 * Enforces WORM (Write Once Read Many) semantics at the infrastructure level
 * using AWS S3 Object Lock in COMPLIANCE mode.
 *
 * Facts and proofs are stored with COMPLIANCE retention (100 years).
 * Projections are stored WITHOUT Object Lock since they are mutable.
 */
export class S3ObjectLockStorage implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  readonly isWORM = true;

  constructor(config: S3ObjectLockStorageConfig) {
    this.bucket = config.bucket;
    this.prefix = config.prefix;

    const clientConfig: S3ClientConfig = {
      region: config.region,
    };

    if (config.credentials) {
      clientConfig.credentials = config.credentials;
    }

    this.client = new S3Client(clientConfig);
  }

  // ─── Fact Operations ───────────────────────────────────────────────

  /** Append a fact with COMPLIANCE Object Lock (immutable after write). */
  async append(fact: Fact): Promise<void> {
    const key = `${this.prefix}/facts/${fact.id}.json`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: JSON.stringify(fact),
          ContentType: 'application/json',
          ObjectLockMode: 'COMPLIANCE',
          ObjectLockRetainUntilDate: new Date(
            Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
          ),
        })
      );
    } catch (error) {
      throw this.enrichError(error, `append(fact=${fact.id})`, key);
    }
  }

  /** Retrieve a single fact by ID. Returns null if not found. */
  async getFact(id: string): Promise<Fact | null> {
    const key = `${this.prefix}/facts/${id}.json`;
    return this.getObject<Fact>(key);
  }

  /** List facts, optionally filtered by minimum sequence and limited in count. */
  async getFacts(since?: number, limit?: number): Promise<Fact[]> {
    const prefix = `${this.prefix}/facts/`;
    const keys = await this.listKeys(prefix);

    // Batch fetch all objects
    const facts = await this.batchGet<Fact>(keys);

    // Filter by sequence number if provided
    let result = facts;
    if (since !== undefined) {
      result = result.filter((fact) => fact.sequence >= since);
    }

    // Sort by sequence for deterministic ordering
    result.sort((a, b) => a.sequence - b.sequence);

    // Apply limit if provided
    if (limit !== undefined && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }

  // ─── Proof Operations ──────────────────────────────────────────────

  /** Append a proof with COMPLIANCE Object Lock (immutable after write). */
  async appendProof(proof: Proof): Promise<void> {
    const key = `${this.prefix}/proofs/${proof.factId}/${proof.id}.json`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: JSON.stringify(proof),
          ContentType: 'application/json',
          ObjectLockMode: 'COMPLIANCE',
          ObjectLockRetainUntilDate: new Date(
            Date.now() + 100 * 365 * 24 * 60 * 60 * 1000
          ),
        })
      );
    } catch (error) {
      throw this.enrichError(error, `appendProof(proof=${proof.id})`, key);
    }
  }

  /** Get the first proof for a given fact ID. Returns null if not found. */
  async getProof(factId: string): Promise<Proof | null> {
    const prefix = `${this.prefix}/proofs/${factId}/`;
    const keys = await this.listKeys(prefix);

    if (keys.length === 0) {
      return null;
    }

    return this.getObject<Proof>(keys[0]);
  }

  /** Get all proofs for a given fact ID. */
  async getProofs(factId: string): Promise<Proof[]> {
    const prefix = `${this.prefix}/proofs/${factId}/`;
    const keys = await this.listKeys(prefix);
    return this.batchGet<Proof>(keys);
  }

  // ─── Projection Operations ─────────────────────────────────────────

  /** Save a projection — NO Object Lock (projections are mutable). */
  async saveProjection(projection: Projection): Promise<void> {
    const key = `${this.prefix}/projections/${projection.id}.json`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: JSON.stringify(projection),
          ContentType: 'application/json',
          // No Object Lock — projections are mutable
        })
      );
    } catch (error) {
      throw this.enrichError(error, `saveProjection(projection=${projection.id})`, key);
    }
  }

  /** Retrieve a projection by ID. Returns null if not found. */
  async getProjection(id: string): Promise<Projection | null> {
    const key = `${this.prefix}/projections/${id}.json`;
    return this.getObject<Projection>(key);
  }

  // ─── Health Check ──────────────────────────────────────────────────

  /** Verify connectivity to the S3 bucket via HeadBucket. */
  async healthCheck(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket })
      );
    } catch (error) {
      throw this.enrichError(error, 'healthCheck()', this.bucket);
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  /**
   * Get a single object from S3, parse as JSON, and return typed.
   * Returns null if the object does not exist (NoSuchKey).
   */
  private async getObject<T>(key: string): Promise<T | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      if (!response.Body) {
        return null;
      }

      const body = await response.Body.transformToString();
      return JSON.parse(body) as T;
    } catch (error) {
      if (this.isNoSuchKey(error)) {
        return null;
      }
      throw this.enrichError(error, `getObject(${key})`, key);
    }
  }

  /**
   * List all object keys under a given prefix.
   * Handles pagination automatically.
   */
  private async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    try {
      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );

        if (response.Contents) {
          for (const obj of response.Contents) {
            if (obj.Key) {
              keys.push(obj.Key);
            }
          }
        }

        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (error) {
      throw this.enrichError(error, `listKeys(${prefix})`, prefix);
    }

    return keys;
  }

  /**
   * Batch fetch multiple objects by key, parsing each as JSON.
   * Silently skips keys that return NoSuchKey.
   */
  private async batchGet<T>(keys: string[]): Promise<T[]> {
    const results: T[] = [];

    // Fetch in parallel for performance
    const settled = await Promise.allSettled(
      keys.map((key) => this.getObject<T>(key))
    );

    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      }
    }

    return results;
  }

  /**
   * Check if an S3 error represents a "no such key" condition.
   */
  private isNoSuchKey(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const code = (error as { Code?: string }).Code;
      if (code === NO_SUCH_KEY || code === NOT_FOUND) {
        return true;
      }
      // Also check for the $metadata style errors from AWS SDK v3
      const name = (error as { name?: string }).name;
      if (name === NO_SUCH_KEY || name === NOT_FOUND) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if an S3 error represents an access denied condition.
   */
  private isAccessDenied(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const code = (error as { Code?: string }).Code;
      if (code === ACCESS_DENIED || code === ALL_ACCESS_DISABLED) {
        return true;
      }
      const name = (error as { name?: string }).name;
      if (name === ACCESS_DENIED || name === ALL_ACCESS_DISABLED) {
        return true;
      }
    }
    return false;
  }

  /**
   * Enrich an error with context about the operation, bucket, and key.
   * AccessDenied errors get special treatment with additional guidance.
   */
  private enrichError(error: unknown, operation: string, key: string): Error {
    if (this.isAccessDenied(error)) {
      const msg =
        `S3 AccessDenied during ${operation} on bucket "${this.bucket}", key "${key}". ` +
        `Ensure the IAM principal has the required s3:* permissions for this bucket.`;
      return new Error(msg, { cause: error });
    }

    const message =
      error instanceof Error ? error.message : String(error);

    return new Error(
      `S3 error during ${operation} on bucket "${this.bucket}", key "${key}": ${message}`,
      { cause: error }
    );
  }
}
