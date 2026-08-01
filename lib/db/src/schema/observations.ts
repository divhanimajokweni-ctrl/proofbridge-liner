import { pgTable, text, timestamp, jsonb, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const observationSourceEnum = pgEnum("observation_source", [
  "camera",
  "sensor",
  "edge-node",
  "system",
  "operator",
]);

export const observationSeverityEnum = pgEnum("observation_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const observationsTable = pgTable(
  "observations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    siteId: text("site_id"),
    cameraId: text("camera_id"),
    nodeId: text("node_id"),
    source: observationSourceEnum("source").notNull(),
    kind: text("kind").notNull(),
    description: text("description"),
    payload: jsonb("payload").notNull().default({}),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    correlationKey: text("correlation_key"),
    severity: observationSeverityEnum("severity"),
    aiModel: text("ai_model"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantOccurredIdx: index("observations_tenant_occurred_idx").on(
      table.tenantId,
      table.occurredAt,
    ),
    tenantSiteOccurredIdx: index("observations_tenant_site_occurred_idx")
      .on(table.tenantId, table.siteId, table.occurredAt)
      .where(sql`${table.siteId} IS NOT NULL`),
    tenantCameraOccurredIdx: index("observations_tenant_camera_occurred_idx")
      .on(table.tenantId, table.cameraId, table.occurredAt)
      .where(sql`${table.cameraId} IS NOT NULL`),
    tenantSourceOccurredIdx: index("observations_tenant_source_occurred_idx").on(
      table.tenantId,
      table.source,
      table.occurredAt,
    ),
    tenantSeverityOccurredIdx: index("observations_tenant_severity_occurred_idx")
      .on(table.tenantId, table.severity, table.occurredAt)
      .where(sql`${table.severity} IS NOT NULL`),
  }),
);

export const insertObservationSchema = createInsertSchema(observationsTable).omit({
  occurredAt: true,
  createdAt: true,
});
export type InsertObservation = z.infer<typeof insertObservationSchema>;
export type ObservationRecord = typeof observationsTable.$inferSelect;
