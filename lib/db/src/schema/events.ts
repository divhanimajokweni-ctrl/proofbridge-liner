import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eventSeverityEnum = pgEnum("event_severity", ["info", "warning", "critical"]);

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull(),
  siteName: text("site_name").notNull(),
  cameraId: text("camera_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  severity: eventSeverityEnum("severity").notNull().default("info"),
  aiModel: text("ai_model").notNull().default("SafeGrid-Vision-v2"),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ timestamp: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
