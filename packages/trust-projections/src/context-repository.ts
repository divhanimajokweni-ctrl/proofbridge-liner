// packages/trust-projections/src/context-repository.ts
// ───────────────────────────────────────────────────────────────
// Trust Context Repository
// Durable storage for Trust Contexts in PostgreSQL
// ───────────────────────────────────────────────────────────────

import { trustContexts } from '@proofbridge/contracts/db/schema';
import type { TrustContext, TrustContextStatus } from '@proofbridge/trust-types';
import { eq } from 'drizzle-orm';

export class ContextRepository {
  constructor(private db: any) {}

  /**
   * Save or update a Trust Context
   */
  async saveContext(context: TrustContext): Promise<void> {
    await this.db
      .insert(trustContexts)
      .values({
        contextId: context.contextId,
        trustAnchor: context.trustAnchor,
        configurationReceipt: context.configurationReceipt,
        verificationPolicy: context.verificationPolicy,
        receiptRoot: context.receiptRoot,
        status: context.status,
        createdAt: new Date(context.createdAt),
        updatedAt: new Date(context.updatedAt),
      })
      .onConflictDoUpdate({
        target: trustContexts.contextId,
        set: {
          status: context.status,
          updatedAt: new Date(context.updatedAt),
          receiptRoot: context.receiptRoot,
        },
      });
  }

  /**
   * Get Trust Context by ID
   */
  async getContext(contextId: string): Promise<any | undefined> {
    const results = await this.db
      .select()
      .from(trustContexts)
      .where(eq(trustContexts.contextId, contextId))
      .limit(1);
    
    return results[0];
  }

  /**
   * Update context status
   */
  async updateStatus(contextId: string, status: TrustContextStatus): Promise<void> {
    await this.db
      .update(trustContexts)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(trustContexts.contextId, contextId));
  }

  /**
   * Get all contexts
   */
  async getAllContexts(): Promise<any[]> {
    return await this.db.select().from(trustContexts);
  }
}
