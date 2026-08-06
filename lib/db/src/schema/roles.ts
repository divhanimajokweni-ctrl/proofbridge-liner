import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const permissionActionEnum = pgEnum("permission_action", [
  "create",
  "read",
  "update",
  "delete",
  "execute",
  "admin",
]);

export const permissionResourceEnum = pgEnum("permission_resource", [
  "tenant",
  "site",
  "camera",
  "alert",
  "event",
  "user",
  "role",
  "api_key",
  "config",
  "edge_node",
]);

export const permissionsTable = pgTable("permissions", {
  id: text("id").primaryKey(),
  action: permissionActionEnum("action").notNull(),
  resource: permissionResourceEnum("resource").notNull(),
  resourceId: text("resource_id"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolesTable = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  tenantId: text("tenant_id"),
  isSystem: text("is_system").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rolePermissionsTable = pgTable("role_permissions", {
  roleId: text("role_id")
    .notNull()
    .references(() => rolesTable.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissionsTable.id, { onDelete: "cascade" }),
});

export const userRolesTable = pgTable("user_roles", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => rolesTable.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const insertPermissionSchema = createInsertSchema(permissionsTable).omit(
  { createdAt: true },
);
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissionsTable.$inferSelect;

export const insertRoleSchema = createInsertSchema(rolesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;
