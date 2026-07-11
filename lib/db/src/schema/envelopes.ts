import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const envelopes = pgTable("envelopes", {
  envelope_id: uuid("envelope_id").primaryKey().defaultRandom(),
  issuer_address: text("issuer_address").notNull(),
  content_hash: text("content_hash").notNull(),
  signature: text("signature").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
  kernel_state: text("kernel_state").default("PENDING"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Envelope = typeof envelopes.$inferSelect;
export type NewEnvelope = typeof envelopes.$inferInsert;
