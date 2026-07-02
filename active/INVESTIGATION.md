# INVESTIGATION — STABILIZATION & TYPE FIXES — 2026-07-02

## Task
Stabilize the committed Drizzle DB layer, fix the 15 pre-existing TypeScript errors in the ported vv-monorepo packages, and verify the pre-push critical files are present before the next deploy.

## October 2026 Audit Findings (from investigation session)
1. Pre-push critical files: ✅ all present (`app/api/verify/route.ts`, `app/api/mint/route.ts`, `src/middleware.ts`, `AGENTS.md`)
2. Drizzle DB layer: ✅ committed as `12c8c5d` on `compliance-fabric`
3. `.gitignore` carve-out: ✅ `/lib/` now exempts `/lib/db/` and `/lib/db/**`
4. TypeScript errors: 15 errors remain in `lib/safestakes/`, `lib/safekrypte/`, `lib/mainframe/` — none in `lib/db/`
5. `DATABASE_URL`: not yet set in `.env`; Supabase project not yet linked
6. Four compliance-fabric branch variants exist; only `compliance-fabric` is canonical

## Current State

### Drizzle ORM — LANDED ✅
- **Commit**: `12c8c5d` on `compliance-fabric`
- **Schema**: 16 files, 35 tables across `public`, `ubuntu_pools`, `safestake`
- **Migration**: `lib/db/migrations/0000_smooth_zuras.sql` + `meta/_journal.json` + `meta/0000_snapshot.json`
- **Config**: `lib/db/drizzle.config.ts` — PostgreSQL, schema `./src/schema/index.ts`, out `path.join(__dirname, "./migrations")`
- **Dependencies**: `drizzle-kit 0.31.10`, `drizzle-orm 0.45.2`, `drizzle-zod 0.5.1`, `pg 8.22.0`, `@types/pg 8.20.0`
- **Typecheck**: zero errors in `lib/db/`
- **README**: `lib/db/README.md` written
- **Env**: `.env.local.example` has `DATABASE_URL` placeholder

### Supabase — DUAL SETUP
- **SQL migrations**: 7 files in `supabase/migrations/` (auth, RLS, governance, consent, audit chain, token columns)
- **Table conflicts**: NONE — Drizzle tables use distinct names from Supabase-managed tables
- **Linked project**: no `supabase/config.toml`; project credentials empty in `.env.production.local`

### TypeScript Errors — 15 BLOCKING

| File | Errors | Root Cause |
|------|--------|-----------|
| `lib/mainframe/src/metric-emitter.ts` | 3 | `express` typings missing |
| `lib/safekrypte/src/simulator.ts` | 3 | `express` typings missing |
| `lib/safestakes/src/core/executeSlash.ts` | 5 | Missing contract exports + duplicate `reject()` |
| `lib/safestakes/src/core/renewal-grace.ts` | 1 | Missing `./escrow-custody` import |
| `lib/safestakes/src/simulator.ts` | 3 | `express` typings missing |

### Branch State
- **Canonical**: `compliance-fabric` (`0f6ebab` → `6b2a5ff` → `7de801a` → `1efd463` → `28738b8` → `12c8c5d`)
- **Remote variants**: `compliance-fabriC` (capital C), `feat/compliance-fabric-v2`, `backup/local-compliance-fabric` — all have real work to cherry-pick

## Hard Failures In Scope
None. This is Tier-2 stabilization.

## Unknowns
1. Whether `express` is a runtime dependency or just missing typings in the simulator files
2. Whether `contracts/schemas/index.ts` should export the missing SafeStakes types
3. Whether `escrow-custody.ts` exists elsewhere in the ported code