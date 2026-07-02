import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const gameIdEnum = pgEnum("game_id", [
  "ubuntu_monopoly",
  "pool_simulator",
  "credit_ladder",
  "the_commons",
  "market_maker",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "waiting",
  "active",
  "paused",
  "completed",
  "abandoned",
]);

export const signalTypeEnum = pgEnum("signal_type", [
  "risk_appetite",
  "cooperative_quotient",
  "stress_response",
  "overextension",
  "leadership_index",
  "knowledge_score",
]);

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: varchar("member_id", { length: 255 }).notNull(),
    gameId: gameIdEnum("game_id").notNull(),
    status: gameStatusEnum("status").notNull().default("waiting"),
    startedAt: timestamptz("started_at").notNull().defaultNow(),
    completedAt: timestamptz("completed_at"),
    durationMs: integer("duration_ms"),
    stateSnapshot: jsonb("state_snapshot"),
    finalScore: integer("final_score"),
    prestigeAwarded: integer("prestige_awarded").notNull().default(0),
    isMultiplayer: boolean("is_multiplayer").notNull().default(false),
    villageId: varchar("village_id", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    memberIdx: index("idx_game_sessions_member").on(t.memberId),
    gameIdx: index("idx_game_sessions_game").on(t.gameId),
    villageIdx: index("idx_game_sessions_village").on(t.villageId),
  }),
);

export const gameEvents = pgTable(
  "game_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id),
    memberId: varchar("member_id", { length: 255 }).notNull(),
    sequence: integer("sequence").notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_game_events_session").on(t.sessionId),
    memberIdx: index("idx_game_events_member").on(t.memberId),
    sessionSeqUnique: uniqueIndex("game_events_session_id_sequence_key").on(
      t.sessionId,
      t.sequence,
    ),
  }),
);

export const prestigeScores = pgTable("prestige_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: varchar("member_id", { length: 255 }).notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  level: smallint("level").notNull().default(1),
  byGame: jsonb("by_game").notNull().default("{}"),
  ubuntuBonus: smallint("ubuntu_bonus").notNull().default(0),
  lastUpdated: timestamptz("last_updated").notNull().defaultNow(),
});

export const prestigeLedger = pgTable(
  "prestige_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: varchar("member_id", { length: 255 }).notNull(),
    sessionId: uuid("session_id").references(() => gameSessions.id),
    points: integer("points").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    memberIdx: index("idx_prestige_ledger").on(t.memberId),
  }),
);

export const gameTelemetry = pgTable(
  "game_telemetry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: varchar("member_id", { length: 255 }).notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => gameSessions.id),
    signalType: signalTypeEnum("signal_type").notNull(),
    value: integer("value").notNull(),
    confidence: smallint("confidence").notNull(),
    gameId: gameIdEnum("game_id").notNull(),
    consentGiven: boolean("consent_given").notNull().default(false),
    erased: boolean("erased").notNull().default(false),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => ({
    memberIdx: index("idx_game_telemetry_member").on(t.memberId),
    signalIdx: index("idx_game_telemetry_signal").on(t.signalType),
  }),
);

export const villageTournaments = pgTable("village_tournaments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  gameId: gameIdEnum("game_id").notNull(),
  startDate: timestamptz("start_date").notNull(),
  endDate: timestamptz("end_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("upcoming"),
  participants: jsonb("participants").notNull().default("[]"),
  winnerId: varchar("winner_id", { length: 255 }),
  createdAt: timestamptz("created_at").notNull().defaultNow(),
});
