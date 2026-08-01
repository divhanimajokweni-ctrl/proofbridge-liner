import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const apiKeyTypeEnum = pgEnum("api_key_type", [
  "service_account",
  "edge_node",
  "integration",
]);
export const apiKeyStatusEnum = pgEnum("api_key_status", [
  "active",
  "revoked",
  "expired",
]);

export const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  type: apiKeyTypeEnum("type").notNull().default("service_account"),
  status: apiKeyStatusEnum("status").notNull().default("active"),
  userId: text("user_id"),
  tenantId: text("tenant_id").notNull(),
  scopes: text("scopes").array(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({
  keyHash: true,
  keyPrefix: true,
  createdAt: true,
  updatedAt: true,
  lastUsedAt: true,
});
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;
