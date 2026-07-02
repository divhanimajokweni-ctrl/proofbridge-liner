import { pgTable, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const edgeNodeStatusEnum = pgEnum("edge_node_status", [
  "online",
  "offline",
  "warning",
  "error",
]);

export const edgeNodesTable = pgTable("edge_nodes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tenantId: text("tenant_id").notNull(),
  siteId: text("site_id"),
  serialNumber: text("serial_number").unique(),
  certificateFingerprint: text("certificate_fingerprint"),
  status: edgeNodeStatusEnum("status").notNull().default("offline"),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  lastConfigVersion: text("last_config_version"),
  ipAddress: text("ip_address"),
  firmwareVersion: text("firmware_version"),
  cpuUsage: real("cpu_usage"),
  memoryUsage: real("memory_usage"),
  diskUsage: real("disk_usage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEdgeNodeSchema = createInsertSchema(edgeNodesTable).omit({
  createdAt: true,
  updatedAt: true,
  lastHeartbeatAt: true,
});
export type InsertEdgeNode = z.infer<typeof insertEdgeNodeSchema>;
export type EdgeNode = typeof edgeNodesTable.$inferSelect;
