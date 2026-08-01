import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gatewayParticipantsTable = pgTable("gateway_participants", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  onboardingStatus: text("onboarding_status")
    .notNull()
    .default("pending_verification"),
  gatewayVersion: text("gateway_version").notNull().default("2.0-STABLE"),
  ubuntuScore: text("ubuntu_score").notNull().default("0"),
  participantClass: text("participant_class").notNull().default("NaturalPerson"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGatewayParticipantSchema = createInsertSchema(
  gatewayParticipantsTable,
).omit({ createdAt: true });
export type InsertGatewayParticipant = z.infer<
  typeof insertGatewayParticipantSchema
>;
export type GatewayParticipant = typeof gatewayParticipantsTable.$inferSelect;
