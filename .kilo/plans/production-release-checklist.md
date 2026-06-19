# Production Release: proofbridge-liner

## Target branch
`compliance-fabric`

## Pre-flight status
- `app/api/verify/route.ts`: OK
- `app/api/mint/route.ts`: OK
- `middleware.ts`: OK
- `AGENTS.md`: OK

## Current state observations
- Branch is up to date with `origin/compliance-fabric`
- Next.js rewires `/proofbridge`, `/gate-1`..`/gate-6`, `/gates` → `/vvv/` static HTML
- VVU HTML pages already use absolute path `/vvv/pools.css`
- Untracked files: `NMBM_community_prosperity_water_trust.html`, `"VV — Venture Vision Architecture.html"`, `VVU_parallel_water_economy_framework.html` — user confirmed these are excluded from this push
- `.replit` has local modifications — do not commit

## Pre-release prerequisites (user must confirm)

1. **Vercel environment variables** — Confirm these are set in Vercel Production:
   - `POLYGON_AMOY_RPC_URL`
   - `PRIVATE_KEY`
   - `ORACLE_ADDRESS`
   - `ENCLAVE_ADDRESS`
   - `NVIDIA_API_KEY`
   - `SLACK_WEBHOOK_URL`
   - `SLACK_CHANNEL`
   - `ORACLE_PRIVATE_KEY`

2. **Custom domain `venturevisionubuntu.co.za`** — Confirm domain is added to Vercel project and DNS is configured.

## Implementation steps

1. Add `.vercelignore` to exclude non-UI artifacts:
   ```
   cache/
   .config/
   .git/
   .gitignore
   .replit
   NMBM_community_prosperity_water_trust.html
   "VV — Venture Vision Architecture.html"
   VVU_parallel_water_economy_framework.html
   ```

2. Run `npm run build` and confirm it succeeds.

3. Stage and commit:
   ```
   git add .vercelignore
   git commit -m "chore: add vercelignore and prepare production release"
   ```

4. Push to origin:
   ```
   git push origin compliance-fabric
   ```

5. Verify deployment at `https://venturevisionubuntu.co.za` and key routes:
   - `/` → 200
   - `/proofbridge` → 200
   - `/gates` → 200
   - `/gate-1` .. `/gate-6` → 200
   - `/api/verify` → 200
   - `/api/mint` → 200
