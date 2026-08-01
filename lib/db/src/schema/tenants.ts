import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tenantPlanEnum = pgEnum("tenant_plan", ["starter", "professional", "enterprise"]);
export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "trial"]);

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  plan: tenantPlanEnum("plan").notNull().default("starter"),
  siteCount: integer("site_count").notNull().default(0),
  cameraCount: integer("camera_count").notNull().default(0),
  activeAlerts: integer("active_alerts").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: tenantStatusEnum("status").notNull().default("active"),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ createdAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;
