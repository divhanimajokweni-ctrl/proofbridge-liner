# Test Report — Supabase Auth (replaces Clerk)

**Date:** 2026-07-10
**Branch:** `devin/1783716651-trust-runtime-homepage` (PR #26)
**Env:** local dev server `http://localhost:3000`, Supabase project `jazbzpoeilaghppxzewy`

## Summary

Clerk was removed and replaced with **Supabase email/password auth** (no external DNS required — this fixes the Clerk `pk_live` domain blocker). Core auth is wired and working:

| Test | Result |
|------|--------|
| Signed-out `/dashboard` redirects to `/login` | ✅ PASS |
| Signed-out `/safekrypte` redirects to `/login` | ✅ PASS |
| Sign-in / sign-up form renders | ✅ PASS |
| Account creation via Supabase sign-up | ✅ PASS |
| Sign-in gated until email confirmed | ✅ PASS |
| Homepage shows "Sign in" control | ✅ PASS |
| Dashboard access after email confirmation | ⚠️ UNTESTED (see note) |

**Note:** The Supabase project has **"Confirm email" ON** (`mailer_autoconfirm=false`), so a newly created user must click the confirmation link emailed to them before they can sign in. There is no inbox access on the test box, so the final "logged-in dashboard" step could not be exercised here. Turning **Authentication → Providers → Email → Confirm email OFF** in the Supabase dashboard makes signup → instant login (recommended for the smoothest UX).

## Backend verification (direct Supabase REST)

- `GET /auth/v1/settings` → `200`, `disable_signup=false`, `external.email=true`, `mailer_autoconfirm=false`
- `POST /auth/v1/signup` → `200`, user created, `confirmation_sent_at` set
- `POST /auth/v1/token?grant_type=password` (unconfirmed) → `400 email_not_confirmed`

## Evidence

### 1. Protected route redirect — `/dashboard` → `/login?redirect=%2Fdashboard`
![dashboard redirect](/home/ubuntu/screenshots/ss_e2aa00dc.png)

### 2. Create-account form
![create account](/home/ubuntu/screenshots/ss_cc21999f.png)

### 3. Account created (Supabase sign-up succeeded)
![account created](/home/ubuntu/screenshots/ss_e14bb030.png)

### 4. Sign-in gated — "Email not confirmed"
![email not confirmed](/home/ubuntu/screenshots/ss_9952cae9.png)

### 5. Homepage with "Sign in" control (top-right)
![homepage sign in](/home/ubuntu/screenshots/ss_e5184deb.png)

## Implementation

- `src/lib/session/client.ts`, `src/lib/session/server.ts` — Supabase browser/server clients (`@supabase/ssr`)
- `middleware.ts` — session guard for `/dashboard`, `/safekrypte`; fails open if env unset
- `app/login/page.tsx` — email+password sign in / sign up
- `app/session/callback/route.ts` — `exchangeCodeForSession` (email-confirm links)
- `app/session/signout/route.ts` — `signOut`
- `app/AuthControl.tsx` — homepage Sign in / user email + Sign out
- Removed: `@clerk/nextjs`, `ClerkProvider`, `/sign-in`, `/sign-up`

> Dirs were named `session` (not `auth`) because `.vercelignore`/`.gitignore` have a broad `auth/` exclude that dropped the files from the Vercel build.
