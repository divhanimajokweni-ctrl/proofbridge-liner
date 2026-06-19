# Proofbridge-Liner Migration + Unified Production Release

## Context
- Current Vercel project: `workspace` (`.vercel/project.json`)
- Package name: `vvup-platform` v2.1.0
- Critical pre-flight files: OK (`app/api/verify/route.ts`, `app/api/mint/route.ts`, `middleware.ts`, `AGENTS.md`)
- `.vercelignore` present and excludes large/unwanted paths including `deer-flow`
- No `next.config.js` at repo root; Vercel uses default Next.js 14 config

## Steps
1. Confirm Vercel linked project is `workspace` and current branch is `compliance-fabric`.
2. Run `npm run build` (or `vercel build`) to validate production build.
3. Run `npm run typecheck` to confirm TypeScript compilation.
4. If both pass, execute `vercel --prod --force` to release unified production.
5. Verify health at `/api/health` or root on the resulting production URL.

## Caveats
- `proofbridge-liner/` local directory is a stale remnant (contains only `.env`, `dashboard/`, `node_modules/`); not required for unified deploy.
- No Vercel alias management is needed unless domain cutover fails automatically.
