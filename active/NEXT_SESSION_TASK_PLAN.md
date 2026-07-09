# TASK PLAN — Next Headless Session
**Resume from:** 2026-07-09T01:34:57Z  
**Branch:** `compliance-fabric`  
**Mode:** Headless autonomous

## Immediate Tasks (Next Session)

### 1. Install Dependencies
```bash
npm install
```
**Expected outcome:** `fast-check` and `vitest` installed. May need extended timeout.

### 2. Resolve TypeScript Errors
```bash
npx tsc --noEmit
```
**Known issues:**
- `app/api/agent/converse/route.ts` — missing `@/lib/agent/conversation-store` (pre-existing)
- `vitest.config.ts` — `vitest/config` module not found until `npm install` completes

**Fix options for `conversation-store`:**
- A. Restore from git history: `git show 3c85aab:src/lib/agent/conversation-store.ts`
- B. Create minimal stub: `src/lib/agent/conversation-store.ts` with `getConversation`/`addMessage` no-ops

### 3. Push Schema to PostgreSQL
```bash
npm run db:push
```
**Requires:** `DATABASE_URL` in `.env.local`  
**Expected outcome:** Creates `trust_events`, `trust_event_outbox`, `trust_snapshots`, `trust_verification_runs`

### 4. Run Property Tests
```bash
npx vitest run tests/property/event-store.property.test.ts
```
**Expected outcome:** 3 test suites pass with 20-100 iterations each against real PostgreSQL

### 5. Run Full Validation Suite
```bash
npm test
npm run lint
npm run build
```
**Expected outcome:** All pass (pre-existing tests already pass)

### 6. Commit Changes
```bash
git add lib/db/src/schema/trust-runtime.ts \
       lib/db/src/repositories/event-store.repository.ts \
       src/runtime/outbox-worker.ts \
       src/lib/trust-runtime/types.ts \
       src/lib/trust-runtime/command-handler.ts \
       src/lib/trust-runtime/event-store.ts \
       tests/property/event-store.property.test.ts \
       vitest.config.ts \
       package.json \
       active/VALIDATION.md \
       active/SESSION_REPORT_2026-07-09.md \
       active/AGENT_ECOSYSTEM_ARCHITECTURE.md

git commit -m "feat: durable event store & transactional outbox with OCC, governance hashes, and property tests"
```

## Contingency Tasks

### If `npm install` fails
- Retry with `npm ci` (clean install from lockfile)
- Or install individually: `npm install --save-dev fast-check vitest`

### If `db:push` fails
- Verify `DATABASE_URL` is set and PostgreSQL is reachable
- Check drizzle-kit version compatibility
- Fallback: generate migration SQL manually via `drizzle-kit generate`

### If property tests fail
- Check PostgreSQL connection
- Verify schema was pushed correctly
- Reduce `numRuns` in property tests if timeout

## Rollback Plan

If implementation causes regressions:
1. `git revert HEAD` — removes all new files
2. `InMemoryEventStore` remains functional as fallback
3. No production impact until `DATABASE_URL` is set

---

*This plan resumes from the implementation-complete state left by the previous session.*
