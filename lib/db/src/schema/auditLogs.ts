import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const auditActionEnum = pgEnum("audit_action", [
  "login",
  "logout",
  "create",
  "update",
  "delete",
  "execute",
  "access",
  "config_change",
  "auth_override",
  "permission_change",
]);

export const auditSeverityEnum = pgEnum("audit_severity", [
  "info",
  "warning",
  "critical",
]);

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  apiKeyId: text("api_key_id"),
  action: auditActionEnum("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  severity: auditSeverityEnum("severity").notNull().default("info"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestMethod: text("request_method"),
  requestPath: text("request_path"),
  requestBody: jsonb("request_body"),
  responseStatus: text("response_status"),
  metadata: jsonb("metadata"),
  correlationId: text("correlation_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({
  timestamp: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
