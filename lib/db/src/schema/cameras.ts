import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cameraStatusEnum = pgEnum("camera_status", ["online", "offline", "recording", "error"]);
export const cameraTypeEnum = pgEnum("camera_type", ["fixed", "ptz", "thermal", "fisheye"]);

export const camerasTable = pgTable("cameras", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  siteId: text("site_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  status: cameraStatusEnum("status").notNull().default("online"),
  type: cameraTypeEnum("type").notNull().default("fixed"),
  zone: text("zone").notNull(),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  lastEvent: timestamp("last_event").notNull().defaultNow(),
  fps: integer("fps").notNull().default(30),
  resolution: text("resolution").notNull().default("1080p"),
});

export const insertCameraSchema = createInsertSchema(camerasTable).omit({ lastEvent: true });
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof camerasTable.$inferSelect;
