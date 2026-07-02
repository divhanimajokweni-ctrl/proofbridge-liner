# INVESTIGATION — DRIZZLE ORM DATABASE LAYER — 2026-07-01

## Task
Complete the Drizzle ORM database layer integration: verify the schema, establish the database connection, generate initial migrations, and ensure the Drizzle-managed application tables are ready for use.

## Current State

### Drizzle ORM Schema — COMPLETE ✅
A full application schema exists at `lib/db/src/schema/` with 16 files exporting tables across four domains:

- **SafeGrid Infrastructure**: `sites`, `cameras`, `alerts`, `events`, `edgeNodes`, `observations`, `incidents`, `tenants`, `policyRules`
- **Ubuntu Pools**: `savingsPools`, `poolMembers`, `contributions`, `gamificationProfiles`, `pointsLedger`
- **SafeStake**: `userProfiles`, `wagerSessions`, `lossVelocityLog`, `redirectTransactions`, `wellnessSignals`, `operatorIntegrations`
- **Financial Intelligence Arcade**: `gameSessions`, `gameEvents`, `prestigeScores`, `prestigeLedger`, `gameTelemetry`, `villageTournaments`
- **Auth/Admin**: `users`, `sessions`, `roles`, `permissions`, `apiKeys`, `auditLogs`

Each table has corresponding Zod insert schemas and TypeScript types via `createInsertSchema` and `$inferSelect`.

### Drizzle Config — EXISTS
- `lib/db/drizzle.config.ts` — schema: `./src/schema/index.ts`, dialect: postgresql, output: `./migrations`, uses `DATABASE_URL`
- `lib/db/src/index.ts` — exports `db` (drizzle Pool, max 20, 30s idle timeout, 10s connect timeout)
- Schema barrel: `lib/db/src/schema/index.ts` — exports all 16 schema files

### Dependencies — ADDED (uncommitted)
- `drizzle-kit: ^0.31.9`, `drizzle-orm: ^0.35.1`, `drizzle-zod: ^0.5.1` in devDependencies
- `pg: ^8.22.0`, `@types/pg: ^8.20.0` in devDependencies
- Scripts defined: `db:push`, `db:push:force`, `db:studio` pointing to `lib/db/drizzle.config.ts`

### Connection — NOT CONFIGURED ❌
- `DATABASE_URL` is NOT set in `.env` (required by both `drizzle.config.ts` and `lib/db/src/index.ts`)
- Supabase project connection strings are empty in `.env.production.local` and `.env.vercel.tmp`
- `.env.replit` has a local postgres URL (`postgresql://postgres:password@helium/heliumdb?sslmode=disable`) for Replit's internal DB only — not real Supabase
- No `lib/db/migrations/` directory exists yet

### TypeScript Errors — 15 pre-existing errors (NONE in Drizzle schema layer)
All errors are in ported vv-monorepo packages:
- 3 × `lib/mainframe/src/metric-emitter.ts`
- 3 × `lib/safekrypte/src/simulator.ts`
- 5 × `lib/safestakes/src/core/executeSlash.ts`
- 1 × `lib/safestakes/src/core/renewal-grace.ts`
- 3 × `lib/safestakes/src/simulator.ts`

Root causes: missing `@types/express`, missing contract schema exports, duplicate function `reject`, missing `escrow-custody` module. The Drizzle schema itself has zero type errors.

## Relevant Audit Findings
Not applicable — this is infrastructure setup, not a Tier-3 compliance change.

## Hard Failures In Scope
None. This task touches none of HF-1 through HF-5. Purely Tier-2 infrastructure.

## Current Branch
`compliance-fabric`

## Required Branch
`compliance-fabric`

## Downstream Dependencies
- Supabase project must be provisioned and provide a connection string
- The Supabase SQL migrations (7 files) and Drizzle schema must NOT have conflicting table definitions
- Apps consuming the schema: SafeGrid dashboard, Ubuntu Pools, SafeStake, Financial Arcade, and the Policy Rules engine

## Unknowns Before Planning
1. **Supabase connection string**: Need to obtain `DATABASE_URL` from an active Supabase project. The Supabase project reference and anon key are empty in env files. Must check if a Supabase project is linked or needs provisioning.
2. **Table name conflicts**: Check Supabase SQL migration `supabase/migrations/` for tables that overlap with Drizzle schema tables (e.g., `users`, `sessions` may be managed by Supabase Auth).
3. **Dual-management strategy**: Decide how Drizzle-managed tables coexist with Supabase-managed auth/RLS tables in the same Postgres instance.
4. **Express type issue**: `@types/express` is needed for the simulator files but is outside the scope of this task.

## Stale Context Risk
Low — schema files were ported from SafeGrid, are complete, and haven't been modified. The `.env` file is from the Slack session and hasn't changed.