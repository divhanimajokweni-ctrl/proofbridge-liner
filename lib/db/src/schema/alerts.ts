import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const alertSeverityEnum = pgEnum("alert_severity", ["critical", "high", "medium", "low"]);
export const alertTypeEnum = pgEnum("alert_type", [
  "intrusion", "weapon_detected", "crowd_anomaly", "fire",
  "tailgating", "loitering", "perimeter_breach", "vehicle_anomaly",
]);
export const alertStatusEnum = pgEnum("alert_status", ["open", "acknowledged", "resolved"]);

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  siteId: text("site_id").notNull(),
  siteName: text("site_name").notNull(),
  cameraId: text("camera_id").notNull(),
  cameraName: text("camera_name").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  type: alertTypeEnum("type").notNull(),
  description: text("description").notNull(),
  status: alertStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  riskScore: real("risk_score").notNull().default(0),
  aiConfidence: real("ai_confidence").notNull().default(0),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
