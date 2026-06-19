# Observability + Deployment State — Current State & Issue Doc

## Current Deployment State
- **Project**: proofbridge-liner (Vercel)
- **Primary aliases**: https://venturevisionubuntu.co.za, https://proofbridge-liner.vercel.app
- **Latest production deployment** (current live on alias): `dpl_5HUyMiTS2aBphgKJpQKwTJzLRQyd`
  - Status: **Ready**
  - Created: Mon Jun 15 2026 ~06:57 UTC
  - Inspector: https://vercel.com/divhanimajokweni-1651s-projects/proofbridge-liner/5HUyMiTS2aBphgKJpQKwTJzLRQyd
- **Latest production build**: Passes `npm run build`
- **Vercel logs for latest deployment**: No recent error-level logs for last 12h
- **Backup branch**: `backup/local-compliance-fabric` contains the clean baseline

## Working Tree
- Modified files: 25 tracked files (UI/admin/developer pages, layout/css, scripts)
- Untracked/app-level artifacts: `.kilo/kilo.jsonc`, `docs/`, `my-workflow/`, `package-lock.json.bak`, `src/app/login/`
- Last commit: `51484f2 fix: resolve three-stdlib registry blocker and harden vercelignore for deployment`

## Pre-Flight Critical Files
- `app/api/verify/route.ts`: present
- `app/api/mint/route.ts`: present
- `middleware.ts`: present
- `AGENTS.md`: present

## The Observed Issue
A 404/build error occurred during deployment attempts. Root cause:
- `src/app/page.tsx` was importing `../(marketing)/page` and expecting a re-export of a default export, which Next.js/TypeScript could not resolve.
- This produced: `Type error: Cannot find module '../(marketing)/page' or its corresponding type declarations.`
- That broke production builds and triggered failed deployments in the deployment history (`Error`/`Ready` alternation).

## Stage Completed
- Replaced the broken import in `src/app/page.tsx` with a side-effect import: `import './(marketing)/page';`
- Verified with `npm run build`: build now passes (only non-blocking ESLint warnings remain)
- Triggered and confirmed production deployment: https://venturevisionubuntu.co.za is **Ready**
- Lint/typecheck behavior documented: warnings only, no blocking failures for this repo today

## Proposed Next Step After Build/Deploy Confirmation
Integrate the tracked observability suite into production docs/readiness flow:
1. Create `docs/observability.md` aligned with ProofBridge Liner’s OTel/vendor integration notes.
2. Update `AGENTS.md` to include the new observability module as an agent-accessible component and add a rollback readiness checklist.
3. Ensure any future `observability.py` additions stay out of the Vercel build context unless routed explicitly (Next.js bundle only contains TS/TSX under `src/`).

## Need Clarification
- Do we want a strict **3-strike rollback** for this session, or do we keep the current successful deployment (`dpl_5HUyMiTS2aBphgKJpQKwTJzLRQyd`) as the live baseline?
- Do you want the docs patch applied as well (observability README/update), or are you stopping at the deploy validation?
