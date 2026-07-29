import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const incidentStatusEnum = pgEnum("incident_status", [
  "open",
  "acknowledged",
  "investigating",
  "resolved",
  "dismissed",
]);

export const incidentSeverityEnum = pgEnum("incident_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const incidentsTable = pgTable(
  "incidents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    siteId: text("site_id"),
    cameraId: text("camera_id"),
    incidentKey: text("incident_key"),
    status: incidentStatusEnum("status").notNull().default("open"),
    severity: incidentSeverityEnum("severity").notNull().default("medium"),
    cause: text("cause").notNull(),
    sourceObservationId: text("source_observation_id"),
    latestObservationAt: timestamp("latest_observation_at").notNull().defaultNow(),
    openedAt: timestamp("opened_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantStatusIdx: index("incidents_tenant_status_idx").on(
      table.tenantId,
      table.status,
      table.openedAt,
    ),
    openKeyIdx: uniqueIndex("incidents_open_key_idx")
      .on(table.tenantId, table.incidentKey)
      .where(sql`${table.closedAt} IS NULL`),
  }),
);

export const incidentEvidenceTable = pgTable(
  "incident_evidence",
  {
    id: text("id").primaryKey(),
    incidentId: text("incident_id").notNull(),
    tenantId: text("tenant_id").notNull(),
    observationId: text("observation_id"),
    type: text("type").notNull(),
    uri: text("uri"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIncidentIdx: index("incident_evidence_tenant_incident_idx").on(
      table.tenantId,
      table.incidentId,
    ),
  }),
);

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  latestObservationAt: true,
  openedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentEvidenceSchema = createInsertSchema(incidentEvidenceTable).omit({
  createdAt: true,
});

export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type InsertIncidentEvidence = z.infer<typeof insertIncidentEvidenceSchema>;
export type IncidentRecord = typeof incidentsTable.$inferSelect;
export type IncidentEvidenceRecord = typeof incidentEvidenceTable.$inferSelect;
