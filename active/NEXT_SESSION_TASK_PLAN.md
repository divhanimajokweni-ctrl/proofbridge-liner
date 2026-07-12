# TASK PLAN — Next Session
**Updated:** 2026-07-10
**Branch to resume on:** `devin/1783716651-trust-runtime-homepage` (PR #26)
**Context:** Homepage shipped + auth migrated Clerk → Supabase. Verified locally. Not yet deployed to `compliance-fabric`.

## Immediate Tasks

### 1. Decide + apply Supabase "Confirm email" setting
- Supabase Dashboard → Authentication → Providers → Email → **Confirm email**.
- ON  = user clicks an email link before first login (current setting).
- OFF = sign up → instantly logged in (smoothest UX).
- No code change needed either way — both are handled.

### 2. Deploy to production (ART OF CHOKE)
```bash
# Pre-flight (must be true first):
npm run dev &                       # dev server on :3000 (health check needs it)
curl -s localhost:3000/api/health   # expect 200
vercel whoami                       # must be authenticated
# Then run the full 13-phase loop (does a REAL vercel --prod deploy):
bash scripts/deployment-loop.sh
```
- Or merge PR #26 into `compliance-fabric` (pre-push hook runs the same loop).
- Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are already in
  Vercel Production, so login works in prod immediately after deploy.

### 3. Post-deploy verification
- Visit `https://venturevisionubuntu.co.za/` → homepage + "Sign in" control.
- Create an account, confirm (if Confirm email is ON), log in, reach `/dashboard`.
- `curl https://venturevisionubuntu.co.za/api/health` → 200.

### 4. Security hygiene
- **Rotate the Clerk `sk_live_…` secret** exposed in chat during setup.
- Optionally remove the now-unused Clerk env vars from Vercel.

## Optional / Follow-up
- Add social login (Google / GitHub) via Supabase providers.
- Add a real `/dashboard` landing experience for signed-in users.

## Known Blockers (pre-existing, NOT from this work — need repo-owner action)
- **Contract Tests** CI fails: Foundry submodules (`openzeppelin-contracts`, `forge-std`) were
  never committed → `forge test` can't resolve imports.
- **Qodana** CI fails: missing `QODANA_CONFIGURATIONS_TOKEN` / config file.
- **Commit Attestation** CI fails: workflow reads the auto-generated merge commit, which can't
  carry the required `ATTESTATION:` block.
- **Gate-1 Smoke** CI fails: "test file not found" → exit 1.
These may block a branch-protected merge; deciding how to handle them is a separate task.

## Rollback Plan
- Vercel instant rollback to a previous deployment via dashboard/CLI (see CLAUDE.md Rollback Checklist).
- The auth middleware fails open, so a missing-env misconfig will not 500 the public site.
