import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userProfiles = pgTable("safestake.user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull(),
  dailyLossLimit: numeric("daily_loss_limit", {
    precision: 10,
    scale: 2,
  }).default("200.00"),
  weeklyLossLimit: numeric("weekly_loss_limit", {
    precision: 10,
    scale: 2,
  }).default("800.00"),
  cooldownMinutes: numeric("cooldown_minutes").default("60"),
  redirectPoolId: uuid("redirect_pool_id"),
  consentVersion: text("consent_version").default("1.0"),
  redirectConsentGiven: boolean("redirect_consent_given")
    .default(false)
    .notNull(),
  consentGivenAt: timestamp("consent_given_at", { withTimezone: true }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
  status: text("status").default("active"),
});

export const wagerSessions = pgTable("safestake.wager_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  operatorId: text("operator_id").notNull(),
  sessionStart: timestamp("session_start", { withTimezone: true }).defaultNow(),
  sessionEnd: timestamp("session_end", { withTimezone: true }),
  totalWagered: numeric("total_wagered", { precision: 10, scale: 2 }).default(
    "0",
  ),
  totalWon: numeric("total_won", { precision: 10, scale: 2 }).default("0"),
  netLoss: numeric("net_loss", { precision: 10, scale: 2 }),
  betCount: numeric("bet_count").default("0"),
  status: text("status", {
    enum: ["active", "completed", "cooled_down", "redirected"],
  }).default("active"),
});

export const lossVelocityLog = pgTable("safestake.loss_velocity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sessionId: uuid("session_id").references(() => wagerSessions.id),
  velocityZarHr: numeric("velocity_zar_hr", { precision: 10, scale: 2 }),
  thresholdPct: numeric("threshold_pct", { precision: 5, scale: 2 }),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }).defaultNow(),
  actionTaken: text("action_taken", {
    enum: ["warning_sent", "cooldown_activated", "redirect_triggered", "none"],
  }),
});

export const redirectTransactions = pgTable("safestake.redirect_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sessionId: uuid("session_id").references(() => wagerSessions.id),
  amountZar: numeric("amount_zar", { precision: 10, scale: 2 }).notNull(),
  destinationPool: uuid("destination_pool"),
  redirectedAt: timestamp("redirected_at", { withTimezone: true }).defaultNow(),
  status: text("status", {
    enum: ["pending", "completed", "failed"],
  }).default("pending"),
});

export const wellnessSignals = pgTable("safestake.wellness_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  signal: text("signal", { enum: ["green", "amber", "red"] }).notNull(),
  weekStart: date("week_start").notNull(),
  delivered: boolean("delivered").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const operatorIntegrations = pgTable("safestake.operator_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  operatorName: text("operator_name").notNull(),
  operatorCode: text("operator_code").unique().notNull(),
  oauth2Endpoint: text("oauth2_endpoint"),
  webhookSecret: text("webhook_secret"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
