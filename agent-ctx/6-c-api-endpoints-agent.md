# Task 6-c: API Endpoints Agent

## Task
Create JSON export API endpoint, system status API endpoint, and enhance /api/stats

## Work Completed

### Part 1: JSON Export API (`/api/export?format=json`)
- Modified `/src/app/api/export/route.ts` — replaced the broken JSON handler (which was just wrapping CSV string in JSON) with a proper structured JSON export
- When `format=json`, returns:
  - `policies`: all policies with details + nested shards
  - `shards`: all shards with invariant evaluations
  - `violations`: all invariant violations
  - `merges`: all merge proposals
  - `exportedAt`: ISO timestamp
  - `version`: "0.6"
- Respects the `scope` query parameter (policies/shards/violations/merges/all)
- Uses `Promise.all` for parallel DB queries
- CSV export functionality preserved unchanged

### Part 2: System Status API (`/api/system`)
- Created `/src/app/api/system/route.ts`
- Returns system status with:
  - `status`: "healthy" | "degraded" | "critical" (computed from DB shard health)
  - `uptime`: seconds since server start (module-level `startTime`)
  - `version`: "0.6"
  - `memoryUsage`: real data from `process.memoryUsage()` (rss, heapUsed, heapTotal in MB)
  - `connections`: 12 (mock)
  - `epoch`: 847 (mock)
  - `lastSync`: ISO timestamp
  - `database`: { connected, size, tables }
  - `activePolicies`, `activeShards`, `pendingMerges`, `openViolations`: real DB counts
  - `syncWaves`: computed from shard health data
- Error handling returns `status: "critical"` with 500 code

### Part 3: Enhanced `/api/stats`
- Added module-level `const startTime = Date.now()` at top of file
- Added 5 new fields to response:
  - `systemUptime`: number (seconds since server start)
  - `memoryUsage`: { rss, heapUsed, heapTotal } from `process.memoryUsage()`
  - `epoch`: 847 (mock)
  - `connections`: 12 (mock)
  - `lastSyncedAt`: ISO timestamp (current time)

## Verification
- Lint: 0 errors, 0 warnings
- All existing functionality preserved
- Work record appended to `/home/z/my-project/worklog.md`
