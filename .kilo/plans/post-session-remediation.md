# Plan: Post-Session Gaps Remediation

## Goal
Close all outstanding gaps from the last session so AGENTS.md pre-flight passes, credential leaks are sealed, and the codebase compiles cleanly.

## Facts
- `AGENTS.md` expects `src/app/api/verify/route.ts` + `src/app/api/mint/route.ts`; actual files are at `app/api/verify/route.ts` + `app/api/mint/route.ts`
- Next.js uses `src/middleware.ts` (Supabase auth only). Root `middleware.ts` has working `isCircuitTripped()` circuit breaker logic but is dead code (Next.js ignores it when `src/` dir exists).
- `auth/wa/creds.json` contains WhatsApp session noise keys + signed identity keys — untracked, not in `.gitignore`
- `dist/` contains build artifacts — untracked, not in `.gitignore`
- `src/lib/tee/attestation.ts` and `src/lib/contracts/circuitBreakerAbi.ts` exist — imports in verify route resolve
- `.gitignore` already covers `.config/`, `.local/`, `.env*` but NOT `auth/` or `dist/`

## Risks
1. **Auth leak** — `auth/wa/creds.json` can be used to impersonate the WhatsApp bridge. **Delete now.**
2. **Pre-flight block** — `test -f src/app/api/verify/route.ts` fails → all builds/deployments halted per AGENTS.md.
3. **Dead circuit breaker** — Root `middleware.ts` has the check but isn't executed; `src/middleware.ts` lacks it.

## Steps (headless — no interactive decisions)

### Step 1 — Sanitize workspace
- Append `auth/` and `dist/` to `.gitignore`
- Delete `auth/wa/creds.json`

### Step 2 — Fix pre-flight path mismatch (Option A: update AGENTS.md)
- Change `AGENTS.md` line 6: `src/app/api/verify/route.ts` → `app/api/verify/route.ts`
- Change `AGENTS.md` line 7: `src/app/api/mint/route.ts` → `app/api/mint/route.ts`

### Step 3 — Consolidate circuit breaker into src/middleware.ts
- Copy `isCircuitTripped()` from `middleware.ts` (root) into `src/middleware.ts`, call it before Supabase auth
- Delete root `middleware.ts` (orphaned — Next.js uses `src/middleware.ts` when `src/` dir exists)

### Step 4 — Build verification
- `npm run typecheck`
- `npm run build`
- Report any type errors

## Out of Scope (deferred)
- Governance docs (GOVERNANCE.md, checklists etc.)
- Merging `vvu-osc-production-hardening` branch into main
- Secret rotation steps (GitHub PAT, Vercel env migration) — require external API access

## Verification
```bash
test -f app/api/verify/route.ts     && echo "verify: ok"
test -f app/api/mint/route.ts       && echo "mint: ok"
grep -q "isCircuitTripped" src/middleware.ts && echo "circuit breaker: ok"     || echo "circuit breaker: MISSING"
grep -q "^auth/" .gitignore          && echo "auth gitignored: ok"
grep -q "^dist/" .gitignore          && echo "dist gitignored: ok"
test ! -f auth/wa/creds.json        && echo "creds removed: ok"
test ! -f middleware.ts             && echo "root middleware removed: ok"
npm run typecheck && echo "typecheck: ok"
npm run build && echo "build: ok"
```
