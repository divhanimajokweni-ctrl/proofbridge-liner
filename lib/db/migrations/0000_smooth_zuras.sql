CREATE TYPE "public"."site_status" AS ENUM('online', 'offline', 'warning');--> statement-breakpoint
CREATE TYPE "public"."camera_status" AS ENUM('online', 'offline', 'recording', 'error');--> statement-breakpoint
CREATE TYPE "public"."camera_type" AS ENUM('fixed', 'ptz', 'thermal', 'fisheye');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'trial');--> statement-breakpoint
CREATE TYPE "public"."alert_severity" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('open', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('intrusion', 'weapon_detected', 'crowd_anomaly', 'fire', 'tailgating', 'loitering', 'perimeter_breach', 'vehicle_anomaly');--> statement-breakpoint
CREATE TYPE "public"."event_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'operator', 'viewer', 'service');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending', 'locked');--> statement-breakpoint
CREATE TYPE "public"."permission_action" AS ENUM('create', 'read', 'update', 'delete', 'execute', 'admin');--> statement-breakpoint
CREATE TYPE "public"."permission_resource" AS ENUM('tenant', 'site', 'camera', 'alert', 'event', 'user', 'role', 'api_key', 'config', 'edge_node');--> statement-breakpoint
CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."api_key_type" AS ENUM('service_account', 'edge_node', 'integration');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('login', 'logout', 'create', 'update', 'delete', 'execute', 'access', 'config_change', 'auth_override', 'permission_change');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."edge_node_status" AS ENUM('online', 'offline', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."game_id" AS ENUM('ubuntu_monopoly', 'pool_simulator', 'credit_ladder', 'the_commons', 'market_maker');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('waiting', 'active', 'paused', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."signal_type" AS ENUM('risk_appetite', 'cooperative_quotient', 'stress_response', 'overextension', 'leadership_index', 'knowledge_score');--> statement-breakpoint
CREATE TYPE "public"."observation_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."observation_source" AS ENUM('camera', 'sensor', 'edge-node', 'system', 'operator');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('open', 'acknowledged', 'investigating', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"status" "site_status" DEFAULT 'online' NOT NULL,
	"camera_count" integer DEFAULT 0 NOT NULL,
	"active_alerts" integer DEFAULT 0 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL,
	"risk_score" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"site_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"status" "camera_status" DEFAULT 'online' NOT NULL,
	"type" "camera_type" DEFAULT 'fixed' NOT NULL,
	"zone" text NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"last_event" timestamp DEFAULT now() NOT NULL,
	"fps" integer DEFAULT 30 NOT NULL,
	"resolution" text DEFAULT '1080p' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plan" "tenant_plan" DEFAULT 'starter' NOT NULL,
	"site_count" integer DEFAULT 0 NOT NULL,
	"camera_count" integer DEFAULT 0 NOT NULL,
	"active_alerts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" "tenant_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text NOT NULL,
	"site_name" text NOT NULL,
	"camera_id" text NOT NULL,
	"camera_name" text NOT NULL,
	"severity" "alert_severity" NOT NULL,
	"type" "alert_type" NOT NULL,
	"description" text NOT NULL,
	"status" "alert_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"risk_score" real DEFAULT 0 NOT NULL,
	"ai_confidence" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"site_id" text NOT NULL,
	"site_name" text NOT NULL,
	"camera_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"severity" "event_severity" DEFAULT 'info' NOT NULL,
	"ai_model" text DEFAULT 'SafeGrid-Vision-v2' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"tenant_id" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"action" "permission_action" NOT NULL,
	"resource" "permission_resource" NOT NULL,
	"resource_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"tenant_id" text,
	"is_system" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"type" "api_key_type" DEFAULT 'service_account' NOT NULL,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"user_id" text,
	"tenant_id" text NOT NULL,
	"scopes" text[],
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"api_key_id" text,
	"action" "audit_action" NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"severity" "audit_severity" DEFAULT 'info' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"request_method" text,
	"request_path" text,
	"request_body" jsonb,
	"response_status" text,
	"metadata" jsonb,
	"correlation_id" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edge_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text,
	"serial_number" text,
	"certificate_fingerprint" text,
	"status" "edge_node_status" DEFAULT 'offline' NOT NULL,
	"last_heartbeat_at" timestamp,
	"last_config_version" text,
	"ip_address" text,
	"firmware_version" text,
	"cpu_usage" real,
	"memory_usage" real,
	"disk_usage" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "edge_nodes_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "ubuntu_pools.contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid,
	"member_id" uuid,
	"amount_zar" numeric(10, 2) NOT NULL,
	"contributed_at" timestamp with time zone DEFAULT now(),
	"is_on_time" boolean DEFAULT true,
	"method" text DEFAULT 'manual'
);
--> statement-breakpoint
CREATE TABLE "ubuntu_pools.gamification_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" numeric DEFAULT '0',
	"current_streak" numeric DEFAULT '0',
	"longest_streak" numeric DEFAULT '0',
	"level" text DEFAULT 'seed',
	"badges" jsonb DEFAULT '[]'::jsonb,
	"last_activity" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ubuntu_pools.gamification_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "ubuntu_pools.points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"points" numeric NOT NULL,
	"reason" text,
	"awarded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ubuntu_pools.pool_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now(),
	"role" text DEFAULT 'member',
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "ubuntu_pools.savings_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_name" text NOT NULL,
	"created_by" uuid NOT NULL,
	"pool_type" text NOT NULL,
	"target_amount" numeric(12, 2),
	"contribution_zar" numeric(10, 2) NOT NULL,
	"cycle" text NOT NULL,
	"payout_rotation" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safestake.loss_velocity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"velocity_zar_hr" numeric(10, 2),
	"threshold_pct" numeric(5, 2),
	"triggered_at" timestamp with time zone DEFAULT now(),
	"action_taken" text
);
--> statement-breakpoint
CREATE TABLE "safestake.operator_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_name" text NOT NULL,
	"operator_code" text NOT NULL,
	"oauth2_endpoint" text,
	"webhook_secret" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "safestake.operator_integrations_operator_code_unique" UNIQUE("operator_code")
);
--> statement-breakpoint
CREATE TABLE "safestake.redirect_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"amount_zar" numeric(10, 2) NOT NULL,
	"destination_pool" uuid,
	"redirected_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "safestake.user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"daily_loss_limit" numeric(10, 2) DEFAULT '200.00',
	"weekly_loss_limit" numeric(10, 2) DEFAULT '800.00',
	"cooldown_minutes" numeric DEFAULT '60',
	"redirect_pool_id" uuid,
	"consent_version" text DEFAULT '1.0',
	"redirect_consent_given" boolean DEFAULT false NOT NULL,
	"consent_given_at" timestamp with time zone,
	"enrolled_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'active',
	CONSTRAINT "safestake.user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "safestake.wager_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator_id" text NOT NULL,
	"session_start" timestamp with time zone DEFAULT now(),
	"session_end" timestamp with time zone,
	"total_wagered" numeric(10, 2) DEFAULT '0',
	"total_won" numeric(10, 2) DEFAULT '0',
	"net_loss" numeric(10, 2),
	"bet_count" numeric DEFAULT '0',
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "safestake.wellness_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"signal" text NOT NULL,
	"week_start" date NOT NULL,
	"delivered" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"game_id" "game_id" NOT NULL,
	"status" "game_status" DEFAULT 'waiting' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"state_snapshot" jsonb,
	"final_score" integer,
	"prestige_awarded" integer DEFAULT 0 NOT NULL,
	"is_multiplayer" boolean DEFAULT false NOT NULL,
	"village_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_telemetry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"session_id" uuid NOT NULL,
	"signal_type" "signal_type" NOT NULL,
	"value" integer NOT NULL,
	"confidence" smallint NOT NULL,
	"game_id" "game_id" NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"erased" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestige_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"session_id" uuid,
	"points" integer NOT NULL,
	"reason" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestige_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"by_game" jsonb DEFAULT '{}' NOT NULL,
	"ubuntu_bonus" smallint DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prestige_scores_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "village_tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"game_id" "game_id" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" varchar(50) DEFAULT 'upcoming' NOT NULL,
	"participants" jsonb DEFAULT '[]' NOT NULL,
	"winner_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text,
	"camera_id" text,
	"node_id" text,
	"source" "observation_source" NOT NULL,
	"kind" text NOT NULL,
	"description" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"correlation_key" text,
	"severity" "observation_severity",
	"ai_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"observation_id" text,
	"type" text NOT NULL,
	"uri" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text,
	"camera_id" text,
	"incident_key" text,
	"status" "incident_status" DEFAULT 'open' NOT NULL,
	"severity" "incident_severity" DEFAULT 'medium' NOT NULL,
	"cause" text NOT NULL,
	"source_observation_id" text,
	"latest_observation_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubuntu_pools.contributions" ADD CONSTRAINT "ubuntu_pools.contributions_pool_id_ubuntu_pools.savings_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."ubuntu_pools.savings_pools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubuntu_pools.contributions" ADD CONSTRAINT "ubuntu_pools.contributions_member_id_ubuntu_pools.pool_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."ubuntu_pools.pool_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ubuntu_pools.pool_members" ADD CONSTRAINT "ubuntu_pools.pool_members_pool_id_ubuntu_pools.savings_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."ubuntu_pools.savings_pools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safestake.loss_velocity_log" ADD CONSTRAINT "safestake.loss_velocity_log_session_id_safestake.wager_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."safestake.wager_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safestake.redirect_transactions" ADD CONSTRAINT "safestake.redirect_transactions_session_id_safestake.wager_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."safestake.wager_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_telemetry" ADD CONSTRAINT "game_telemetry_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestige_ledger" ADD CONSTRAINT "prestige_ledger_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_events_session" ON "game_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_game_events_member" ON "game_events" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_events_session_id_sequence_key" ON "game_events" USING btree ("session_id","sequence");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_member" ON "game_sessions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_game" ON "game_sessions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_village" ON "game_sessions" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "idx_game_telemetry_member" ON "game_telemetry" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_game_telemetry_signal" ON "game_telemetry" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "idx_prestige_ledger" ON "prestige_ledger" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "observations_tenant_occurred_idx" ON "observations" USING btree ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "observations_tenant_site_occurred_idx" ON "observations" USING btree ("tenant_id","site_id","occurred_at") WHERE "observations"."site_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "observations_tenant_camera_occurred_idx" ON "observations" USING btree ("tenant_id","camera_id","occurred_at") WHERE "observations"."camera_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "observations_tenant_source_occurred_idx" ON "observations" USING btree ("tenant_id","source","occurred_at");--> statement-breakpoint
CREATE INDEX "observations_tenant_severity_occurred_idx" ON "observations" USING btree ("tenant_id","severity","occurred_at") WHERE "observations"."severity" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "incident_evidence_tenant_incident_idx" ON "incident_evidence" USING btree ("tenant_id","incident_id");--> statement-breakpoint
CREATE INDEX "incidents_tenant_status_idx" ON "incidents" USING btree ("tenant_id","status","opened_at");--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_open_key_idx" ON "incidents" USING btree ("tenant_id","incident_key") WHERE "incidents"."closed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "policy_rules_tenant_active_idx" ON "policy_rules" USING btree ("tenant_id","active") WHERE "policy_rules"."active" = true;--> statement-breakpoint
CREATE INDEX "policy_rules_tenant_id_idx" ON "policy_rules" USING btree ("tenant_id") WHERE "policy_rules"."tenant_id" IS NOT NULL;