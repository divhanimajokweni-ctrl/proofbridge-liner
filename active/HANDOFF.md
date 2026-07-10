# HANDOFF — SESSION CHECKPOINT — 2026-07-10

## Where We Are
Shipped the VVU Trust Runtime layout as the production homepage and **migrated user
authentication from Clerk → Supabase** (Clerk was blocked by missing DNS for its custom
domain). Auth is verified working locally. Work is on branch
`devin/1783716651-trust-runtime-homepage` (PR #26) — **not yet merged** to `compliance-fabric`.

---

## What Was Built / Changed

### Homepage
- `app/page.tsx` — VVU Trust Runtime layout is now the site root (replaced the old
  "Foundry // ControlPlane" page), with the time-travel replay upgrade folded in.

### Auth: Clerk removed, Supabase added
| File | Purpose |
|------|---------|
| `app/login/page.tsx` | Email + password sign-in / sign-up screen |
| `src/lib/session/client.ts` | Supabase browser client (`@supabase/ssr`) |
| `src/lib/session/server.ts` | Supabase server client (cookie-based session) |
| `middleware.ts` (root) | Session guard for `/dashboard` + `/safekrypte`; **fails open** if env unset |
| `app/session/callback/route.ts` | Handles email-confirmation link (`exchangeCodeForSession`) |
| `app/session/signout/route.ts` | POST sign-out handler |
| `app/AuthControl.tsx` | Homepage control: "Sign in" / user email + "Sign out" |
| `app/layout.tsx` | Removed `ClerkProvider` |
| `package.json` | Removed `@clerk/nextjs` |
| *(deleted)* | `app/sign-in/`, `app/sign-up/` |

> Dirs are named `session/` (not `auth/`) because `.vercelignore` / `.gitignore` have a
> broad `auth/` exclude that dropped the files from the Vercel build. Do **not** rename back.

### Build fixes (from earlier in the session)
- Restored `lib/compliance/gemma-judge.ts` and authored `lib/db/src/schema/gatewayParticipants.ts`
  (both were referenced but missing → broke `tsc`/`build`).

### Docs
- `README.md` — added "Current Status · Session Log" section.
- `docs/HOW-IT-WORKS.md` — new plain-English guide to every component.
- `active/test-report-supabase-auth.md` — auth test report (with screenshots).

---

## Build / Test Status (local)
| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| Homepage `/` | ✅ HTTP 200 |
| `/login` | ✅ renders |
| `/dashboard`, `/safekrypte` (signed out) | ✅ 307 → `/login?redirect=…` |
| Supabase sign-up (REST + UI) | ✅ HTTP 200, account created |
| Supabase sign-in (unconfirmed) | ✅ correctly returns `email_not_confirmed` |

**Supabase project:** ref `jazbzpoeilaghppxzewy` · `mailer_autoconfirm=false` (Confirm email is ON).

---

## Environment / Secrets
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are saved as permanent Devin
  secrets AND already present in Vercel Production (stored as *Sensitive* → read back empty
  via CLI but inlined into the prod build). Local `.env.local` has been populated for testing.
- ⚠️ The Clerk `sk_live_…` secret was pasted in chat earlier — **rotate it**.

---

## Next Actions
1. **Decide Supabase "Confirm email"** (ON = email-link step before first login; OFF = instant
   login). Dashboard → Authentication → Providers → Email. Code handles both.
2. **Deploy**: merge PR #26 to `compliance-fabric` / run ART OF CHOKE
   (`bash scripts/deployment-loop.sh`). This does a real `vercel deploy --prod` + live health
   check. Login will work in prod immediately (env vars already set).
3. **Rotate the exposed Clerk secret.**
4. (Optional) Add social login (Google/GitHub) via Supabase.

## Unresolved / Pre-existing (NOT caused by this session)
- Red GitHub CI gates unrelated to auth: **Contract Tests** (Foundry submodules never committed),
  **Qodana** (missing token/config), **Commit Attestation** (reads the auto-merge commit),
  **Gate-1 Smoke** (missing test file). These need repo-owner action and may block a protected merge.
- CLAUDE.md R4 hard failures HF-1..5 (mainnet blockers) are unrelated to the homepage/auth deploy.
