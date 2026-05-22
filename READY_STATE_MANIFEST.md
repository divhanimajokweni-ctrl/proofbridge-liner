# ProofBridge Liner Ready-State Manifest

**Last Updated:** 2026-05-22

## Production Target

- Canonical domain: `https://venturevisionubuntu.co.za`
- Apex DNS target: `76.76.21.21`
- WWW DNS target: `cname.vercel-dns.com.`
- Active Vercel project: `proofbridge-liner`
- Replit runtime: `dashboard/server.js` on port `5000`

## Required Runtime Contract

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

## Implemented State

- [x] Gate-1 verify receipts use RS256 through `api/lib/receipt-signing.js`.
- [x] Gate-1 mint receipts use the same RS256 authority.
- [x] Replit dashboard `/api/verify` uses the same RS256 authority.
- [x] Liquidity Leap telemetry ingress exists at `api/liquidity-leap/telemetry.js`.
- [x] Root `vercel.json` maps `POST /api/liquidity-leap/telemetry`.
- [x] Unity bridge posts telemetry to the Vercel ingress and still supports the vLLM/Kasi WebSocket.
- [x] Deprecated shared-secret Gate-1 legacy API files were removed.
- [x] DNS zone files are aligned to Vercel apex and `www` records.
- [x] CI workflow uses `npm ci`, TypeScript build, Node smoke tests, and route-contract validation.

## Verification Commands

```bash
npm run build
node --test test/gate1-smoke.test.js
```

Expected smoke result:

```txt
3 tests pass
0 tests fail
```

## Production Health Criteria

```txt
https://venturevisionubuntu.co.za              HTTP 200
https://venturevisionubuntu.co.za/api/health   JSON body with receipt_algorithm = RS256
GET /api/liquidity-leap/telemetry              HTTP 405
venturevisionubuntu.co.za                      76.76.21.21
www.venturevisionubuntu.co.za                  Vercel DNS target or resolved Vercel edge IP
```

If `/api/health` returns JavaScript source, the current live deployment is stale and must be redeployed from the root Vercel project.

## Current Release Status

Ready for PR and production deploy after GitHub branch publication. Production deploy must not be marked complete until the custom-domain health route returns the RS256 JSON health payload from the deployed handler.
