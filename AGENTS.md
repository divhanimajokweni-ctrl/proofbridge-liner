# Agent Core Pre-Flight Configuration

## Critical Files
These files MUST exist and be valid before any deployment or build proceeds:

- `app/api/verify/route.ts` — Run `test -f app/api/verify/route.ts` (expected: OK)
- `app/api/mint/route.ts` — Run `test -f app/api/mint/route.ts` (expected: OK)
- `middleware.ts` — Run `test -f middleware.ts` (expected: OK)
- `AGENTS.md` — Run `test -f AGENTS.md` (expected: OK)

## Pre-Flight Blocking Policy
Build, push, and deploy operations halt until all critical files above are present and tests pass.

## Branch Policy
Canonical branch: `compliance-fabric`
Backup branch: `backup/local-compliance-fabric`

## Deployment Rules
- Use `vercel --prod --force` for production deployment
- `.vercelignore` is required to exclude cache/.config/.git and large artifacts
- Validate builds with `npm run build` before deployment

## Troubleshooting
If any critical file is missing:
1. Restore the file from backup/local-compliance-fabric if needed
2. Do NOT proceed with deployment until test -f passes for all paths above
