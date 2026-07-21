// Epistemic Runtime v0.8 — S3 Object Lock Driver
// Production: S3 Object Lock for immutable evidence storage.

import type { Fact, Proof, Projection, StorageProvider } from '@/lib/kernel/types';

/**
 * S3 Object Lock storage driver.
 * 
 * This is a production driver that uses S3 Object Lock to enforce
 * WORM (Write Once Read Many) semantics at the infrastructure level.
 * 
 * In development, use LocalWORMEmulator instead.
 * 
 * Note: This is a stub implementation. In production, configure with
 * actual AWS credentials and bucket settings.
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

  async append(fact: Fact): Promise<void> {
    // Production: PutObject with Object Lock mode GOVERNANCE or COMPLIANCE
    // Key: ${prefix}/facts/${fact.id}.json
    // Lock mode: COMPLIANCE (cannot be overridden by any user)
    // Retention: Indefinite (or configured retention period)
    
    // Stub: In production, this would use AWS SDK
    console.log(`[S3] Would append fact ${fact.id} to s3://${this.bucket}/${this.prefix}/facts/${fact.id}.json`);
  }

  async getFact(id: string): Promise<Fact | null> {
    // Production: GetObject from S3
    console.log(`[S3] Would get fact ${id} from s3://${this.bucket}/${this.prefix}/facts/${id}.json`);
    return null;
  }

  async getFacts(since?: number, limit?: number): Promise<Fact[]> {
    // Production: ListObjectsV2 with prefix, then batch GetObject
    console.log(`[S3] Would list facts from s3://${this.bucket}/${this.prefix}/facts/`);
    return [];
  }

  async getProof(factId: string): Promise<Proof | null> {
    // Production: GetObject from S3
    console.log(`[S3] Would get proof for ${factId}`);
    return null;
  }

  async appendProof(proof: Proof): Promise<void> {
    // Production: PutObject with Object Lock
    console.log(`[S3] Would append proof ${proof.id}`);
  }

  async getProofs(factId: string): Promise<Proof[]> {
    // Production: ListObjectsV2 + GetObject
    console.log(`[S3] Would list proofs for ${factId}`);
    return [];
  }

  async saveProjection(projection: Projection): Promise<void> {
    // Projections are NOT WORM — they can be updated
    // Store in a separate prefix without Object Lock
    console.log(`[S3] Would save projection ${projection.id}`);
  }

  async getProjection(id: string): Promise<Projection | null> {
    console.log(`[S3] Would get projection ${id}`);
    return null;
  }
}
