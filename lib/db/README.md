# lib/db — Drizzle ORM Database Layer

Shared PostgreSQL schema and database access layer using Drizzle ORM.

## Quick Start

```bash
# Set up your Supabase Postgres connection string
export DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Push schema to database (creates/updates tables)
npm run db:push

# Force push (resets data — use with caution)
npm run db:push:force

# Launch Drizzle Studio (GUI data browser)
npm run db:studio
```

## Usage in Code

```typescript
import { db } from "@/lib/db/src";
import { sitesTable } from "@/lib/db/src/schema/sites";

// Query
const allSites = await db.select().from(sitesTable);

// Insert
await db.insert(sitesTable).values({
  id: "site-1",
  name: "Main Site",
  location: "Johannesburg",
  tenantId: "tenant-1",
});
```

## Schema Map

### Public Schema
| Table | File | Description |
|-------|------|-------------|
| `sites` | `schema/sites.ts` | SafeGrid site locations |
| `cameras` | `schema/cameras.ts` | Camera devices |
| `tenants` | `schema/tenants.ts` | Multi-tenant organizations |
| `alerts` | `schema/alerts.ts` | Security alerts |
| `events` | `schema/events.ts` | Camera events |
| `users` | `schema/users.ts` | Application users |
| `sessions` | `schema/users.ts` | User sessions |
| `roles` | `schema/roles.ts` | RBAC roles |
| `permissions` | `schema/roles.ts` | Fine-grained permissions |
| `role_permissions` | `schema/roles.ts` | Role-permission mapping |
| `user_roles` | `schema/roles.ts` | User-role assignment |
| `api_keys` | `schema/apiKeys.ts` | API key management |
| `audit_logs` | `schema/auditLogs.ts` | Immutable audit trail |
| `edge_nodes` | `schema/edgeNodes.ts` | Edge computing nodes |
| `observations` | `schema/observations.ts` | Sensor/operator observations |
| `incidents` | `schema/incidents.ts` | Security incidents |
| `incident_evidence` | `schema/incidents.ts` | Incident evidence attachments |
| `policy_rules` | `schema/policyRules.ts` | Automated policy rules |
| `game_sessions` | `schema/gamification.schema.ts` | Financial Arcade game sessions |
| `game_events` | `schema/gamification.schema.ts` | Game event log |
| `prestige_scores` | `schema/gamification.schema.ts` | Player prestige scores |
| `prestige_ledger` | `schema/gamification.schema.ts` | Prestige point transactions |
| `game_telemetry` | `schema/gamification.schema.ts` | Behavioral telemetry |
| `village_tournaments` | `schema/gamification.schema.ts` | Competitive events |

### `ubuntu_pools` Schema
| Table | File | Description |
|-------|------|-------------|
| `savings_pools` | `schema/ubuntuPools.ts` | Community savings pools |
| `pool_members` | `schema/ubuntuPools.ts` | Pool membership |
| `contributions` | `schema/ubuntuPools.ts` | Contribution records |
| `gamification_profiles` | `schema/ubuntuPools.ts` | User gamification state |
| `points_ledger` | `schema/ubuntuPools.ts` | Points transaction history |

### `safestake` Schema
| Table | File | Description |
|-------|------|-------------|
| `user_profiles` | `schema/safeStake.ts` | Responsible gaming limits |
| `wager_sessions` | `schema/safeStake.ts` | Gaming session tracking |
| `loss_velocity_log` | `schema/safeStake.ts` | Loss velocity monitoring |
| `redirect_transactions` | `schema/safeStake.ts` | Fund redirects |
| `wellness_signals` | `schema/safeStake.ts` | Weekly wellness indicators |
| `operator_integrations` | `schema/safeStake.ts` | Third-party operator config |

## Migration Commands

```bash
# Generate a new migration from schema changes
npx drizzle-kit generate --config lib/db/drizzle.config.ts

# Preview SQL without applying
npx drizzle-kit generate --config lib/db/drizzle.config.ts

# Apply pending migrations
npx drizzle-kit migrate --config lib/db/drizzle.config.ts
```

## Architecture

- **ORM**: Drizzle ORM 0.45.x (PostgreSQL dialect)
- **Driver**: `pg` (node-postgres) via `drizzle-orm/node-postgres`
- **Database**: Supabase Postgres (shared with Supabase Auth/RLS layer)
- **Migration tool**: drizzle-kit 0.31.x

The Drizzle layer manages application tables. Supabase Auth manages `auth.users`, RLS policies, and related auth infrastructure. There is no overlap — Drizzle tables and Supabase-managed tables use distinct names.

## Conflict Avoidance

- Drizzle tables use `public`, `ubuntu_pools`, and `safestake` schemas
- Supabase SQL migrations manage: `pools`, `members`, `proposals`, `votes`, `delegations`, `consent_records`, `analytics_events`, `community_managers`, `export_logs`, `live_activity`, `receipts`, `replay_guard`, `github_tokens`, `watchdog_incidents`, `webhook_idempotency_keys`
- No overlapping table names exist between Drizzle and Supabase SQL migrations