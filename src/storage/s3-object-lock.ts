// Epistemic Runtime v0.8 — S3 Object Lock Driver
// Production: S3 Object Lock for immutable evidence storage.
//
// CONTRACT: This is a production driver interface. In development, use
// LocalWORMEmulator instead. This driver requires AWS SDK integration
// and is only functional with valid AWS credentials and a bucket
// configured with Object Lock in COMPLIANCE mode.
//
// PRODUCTION SETUP:
// 1. Create an S3 bucket with Object Lock enabled
// 2. Set default retention to COMPLIANCE mode (cannot be overridden)
// 3. Configure IAM role with s3:PutObject, s3:GetObject, s3:ListBucket
// 4. Pass bucket config to constructor
//
// Until AWS SDK is integrated, all methods throw NOT_CONFIGURED errors
// rather than silently returning null/empty (which could hide bugs).

import type { Fact, Proof, Projection, StorageProvider } from '@/lib/kernel/types';

/**
 * S3 Object Lock storage driver.
 *
 * Enforces WORM (Write Once Read Many) semantics at the infrastructure level
 * using AWS S3 Object Lock in COMPLIANCE mode.
 *
 * IMPORTANT: This driver is NOT functional without AWS SDK integration.
 * It throws on all operations to prevent silent data loss in production.
 */
export class S3ObjectLockStorage implements StorageProvider {
  private bucket: string;
  private prefix: string;
  private region: string;
  readonly isWORM = true;

  constructor(config: { bucket: string; prefix: string; region: string }) {
    this.bucket = config.bucket;
    this.prefix = config.prefix;
    this.region = config.region;
  }

  private notConfigured(): never {
    throw new Error(
      `S3ObjectLockStorage is not configured. ` +
      `Install @aws-sdk/client-s3 and integrate with bucket: s3://${this.bucket}/${this.prefix} ` +
      `in region ${this.region}. ` +
      `For development, use LocalWORMEmulator instead.`
    );
  }

  async append(fact: Fact): Promise<void> {
    // Production: PutObject with Object Lock mode COMPLIANCE
    // Key: ${prefix}/facts/${fact.id}.json
    // Lock mode: COMPLIANCE (cannot be overridden by any user)
    // Retention: Indefinite (or configured retention period)
    void fact; // Prevent unused variable warning
    this.notConfigured();
  }

  async getFact(id: string): Promise<Fact | null> {
    // Production: GetObject from S3
    void id;
    this.notConfigured();
  }

  async getFacts(since?: number, limit?: number): Promise<Fact[]> {
    // Production: ListObjectsV2 with prefix, then batch GetObject
    void since; void limit;
    this.notConfigured();
  }

  async getProof(factId: string): Promise<Proof | null> {
    // Production: GetObject from S3
    void factId;
    this.notConfigured();
  }

  async appendProof(proof: Proof): Promise<void> {
    // Production: PutObject with Object Lock
    void proof;
    this.notConfigured();
  }

  async getProofs(factId: string): Promise<Proof[]> {
    // Production: ListObjectsV2 + GetObject
    void factId;
    this.notConfigured();
  }

  async saveProjection(_projection: Projection): Promise<void> {
    // Projections are NOT WORM — they can be updated
    // Store in a separate prefix without Object Lock
    this.notConfigured();
  }

  async getProjection(_id: string): Promise<Projection | null> {
    this.notConfigured();
  }
}
