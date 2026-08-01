import { pgTable, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const siteStatusEnum = pgEnum("site_status", ["online", "offline", "warning"]);

export const sitesTable = pgTable("sites", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: siteStatusEnum("status").notNull().default("online"),
  cameraCount: integer("camera_count").notNull().default(0),
  activeAlerts: integer("active_alerts").notNull().default(0),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  tenantId: text("tenant_id").notNull(),
  riskScore: real("risk_score").notNull().default(0),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ lastSeen: true });
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;
