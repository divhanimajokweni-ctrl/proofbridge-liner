import { pgTable, text, boolean, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const policyRulesTable = pgTable(
  "policy_rules",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id"),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    conditions: jsonb("conditions").notNull(),
    actions: jsonb("actions").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantActiveIdx: index("policy_rules_tenant_active_idx")
      .on(table.tenantId, table.active)
      .where(sql`${table.active} = true`),
    tenantIdIdx: index("policy_rules_tenant_id_idx")
      .on(table.tenantId)
      .where(sql`${table.tenantId} IS NOT NULL`),
  }),
);

export const insertPolicyRuleSchema = createInsertSchema(policyRulesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertPolicyRule = z.infer<typeof insertPolicyRuleSchema>;
export type PolicyRuleRecord = typeof policyRulesTable.$inferSelect;
