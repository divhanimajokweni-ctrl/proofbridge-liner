# Deployment Guide

This document is the production deployment contract for ProofBridge Liner and Venture Vision Ubuntu.

## Canonical Production

- Domain: `https://venturevisionubuntu.co.za`
- Apex DNS: `A 76.76.21.21`
- WWW DNS: `CNAME cname.vercel-dns.com.`
- Health route: `https://venturevisionubuntu.co.za/api/health`
- Verify route: `POST https://venturevisionubuntu.co.za/api/verify`
- Mint route: `POST https://venturevisionubuntu.co.za/api/mint`
- Liquidity Leap ingress: `POST https://venturevisionubuntu.co.za/api/liquidity-leap/telemetry`

Do not use `venturevisualubuntu.co.za`.

## Required Production Environment

The Replit-to-Vercel deploy gate and Vercel production environment must agree on these names:

```txt
PROOFBRIDGE_RECEIPT_PRIVATE_KEY
PROOFBRIDGE_RECEIPT_PUBLIC_KEY
PROOFBRIDGE_RECEIPT_KEY_ID
LIQUIDITY_LEAP_TELEMETRY_KEY
ORACLE_PRIVATE_KEY
ORACLE_PUBLIC_KEY
CONTRACT_ADDRESS
STITCH_CLIENT_ID
STITCH_CLIENT_SECRET
STITCH_SECRET
POOLS_ENGINE_ADDRESS
```

`PROOFBRIDGE_RECEIPT_PRIVATE_KEY` is an RS256 PEM private key, not a shared secret. It may be stored with escaped newlines or as a base64-encoded PEM.

## Predeploy Checks

Run these from the repository root:

```bash
npm ci
npm run build
node --test test/gate1-smoke.test.js
```

Expected smoke coverage:

```txt
Gate-1 AMOY signed receipt -> RS256
Liquidity Leap telemetry ingress -> signed validation_required receipt
Gate-1 MAINNET -> 400 before proof computation
```

## Replit-to-Vercel Production Deploy

```bash
export VERCEL_AUTH_TOKEN=...
export EXPECTED_GIT_BRANCH=main
export EXPECTED_GIT_HEAD=<short-or-full-commit>
export CONFIRM_PROD_DEPLOY=yes
export PRODUCTION_ALIAS_DOMAIN=venturevisionubuntu.co.za
export PRODUCTION_HEALTH_URL=https://venturevisionubuntu.co.za/api/health
npm run deploy:vercel:replit
```

The helper performs these gates before production deploy:

```txt
branch and commit match requested release
worktree is clean
package-lock.json exists
build script exists and passes
test script exists and passes unless explicitly skipped
api/verify.js exists
api/liquidity-leap/telemetry.js exists
vercel.json maps /api/health to /api/verify.js
vercel.json maps /api/liquidity-leap/telemetry to /api/liquidity-leap/telemetry.js
Vercel CLI is trusted and executable
Vercel production env contains every required runtime name
CONTRACT_ADDRESS and POOLS_ENGINE_ADDRESS are present
stale aliases are absent
```

## GitHub Actions Production Deploy

`.github/workflows/deploy-vercel.yml` runs on `main` and manual dispatch. It uses `npm ci`, syntax-checks all active API handlers, builds the TypeScript compliance fabric, runs the Gate-1/Liquidity Leap smoke test, pulls the Vercel production environment, builds with `vercel build --prod`, and deploys with `vercel deploy --prebuilt --prod`.

Required GitHub secrets:

```txt
PROOFBRIDGE_LINER_VERCEL
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## DNS

Authoritative nameservers:

```txt
ns1.host-ww.net
ns2.host-ww.net
```

Zone records:

```txt
@    300 IN A     76.76.21.21
www  300 IN CNAME cname.vercel-dns.com.
api  300 IN A     76.76.21.21
```

Remove stale GitHub Pages records from active DNS:

```txt
@ A 185.199.108.153
@ A 185.199.109.153
@ A 185.199.110.153
@ A 185.199.111.153
www CNAME divhanimajokweni-ctrl.github.io.
```

## Post-Deploy Verification

```bash
curl -I https://venturevisionubuntu.co.za
curl -i https://venturevisionubuntu.co.za/api/health
curl -i https://venturevisionubuntu.co.za/api/liquidity-leap/telemetry
Resolve-DnsName venturevisionubuntu.co.za
Resolve-DnsName www.venturevisionubuntu.co.za
```

Expected:

```txt
apex HTTPS returns 200
/api/health returns JSON with receipt_algorithm: RS256
/api/liquidity-leap/telemetry rejects GET with 405
venturevisionubuntu.co.za resolves to 76.76.21.21
www.venturevisionubuntu.co.za resolves to Vercel
```

If `/api/health` returns JavaScript source instead of JSON, production is still serving an old static artifact and must be redeployed from the root project with the current `vercel.json`.
