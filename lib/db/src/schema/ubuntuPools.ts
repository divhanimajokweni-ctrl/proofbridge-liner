import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const savingsPools = pgTable("ubuntu_pools.savings_pools", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolName: text("pool_name").notNull(),
  createdBy: uuid("created_by").notNull(),
  poolType: text("pool_type", {
    enum: ["stokvel", "family", "circle", "open"],
  }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }),
  contributionZar: numeric("contribution_zar", {
    precision: 10,
    scale: 2,
  }).notNull(),
  cycle: text("cycle", { enum: ["weekly", "monthly", "quarterly"] }).notNull(),
  payoutRotation: jsonb("payout_rotation").default(sql`'[]'::jsonb`),
  status: text("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const poolMembers = pgTable("ubuntu_pools.pool_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id").references(() => savingsPools.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  role: text("role", { enum: ["admin", "member"] }).default("member"),
  status: text("status").default("active"),
});

export const contributions = pgTable("ubuntu_pools.contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id").references(() => savingsPools.id),
  memberId: uuid("member_id").references(() => poolMembers.id),
  amountZar: numeric("amount_zar", { precision: 10, scale: 2 }).notNull(),
  contributedAt: timestamp("contributed_at", {
    withTimezone: true,
  }).defaultNow(),
  isOnTime: boolean("is_on_time").default(true),
  method: text("method").default("manual"),
});

export const gamificationProfiles = pgTable(
  "ubuntu_pools.gamification_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").unique().notNull(),
    totalPoints: numeric("total_points").default("0"),
    currentStreak: numeric("current_streak").default("0"),
    longestStreak: numeric("longest_streak").default("0"),
    level: text("level").default("seed"),
    badges: jsonb("badges").default(sql`'[]'::jsonb`),
    lastActivity: timestamp("last_activity", {
      withTimezone: true,
    }).defaultNow(),
  },
);

export const pointsLedger = pgTable("ubuntu_pools.points_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  eventType: text("event_type").notNull(),
  points: numeric("points").notNull(),
  reason: text("reason"),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow(),
});
