# ProofBridge Liner Public Surface

This directory contains the static Venture Vision Ubuntu and Ubuntu Pools public pages served by the root `vercel.json` routes.

## Production Contract

Canonical domain: `https://venturevisionubuntu.co.za`

The apex domain must resolve to Vercel with `A 76.76.21.21`. The `www` host must resolve to Vercel with `CNAME cname.vercel-dns.com.` or the provider-equivalent Vercel record. Do not use `proofbridge-liner.vercel.app` in public copy except as a temporary deployment URL during Vercel diagnostics.

Gate-1 receipts are RS256-signed. Production must provide `PROOFBRIDGE_RECEIPT_PRIVATE_KEY`; `PROOFBRIDGE_RECEIPT_PUBLIC_KEY` and `PROOFBRIDGE_RECEIPT_KEY_ID` should also be set so downstream verifiers can pin the public receipt authority.

Liquidity Leap telemetry enters through `POST /api/liquidity-leap/telemetry`. Set `LIQUIDITY_LEAP_TELEMETRY_KEY` when Unity clients should be required to send the `x-proofbridge-telemetry-key` header.

## Local Development

```bash
npm install
npm run start
```

Static pages are served from `vvv/`; API routes are served from root `api/` by Vercel and from `dashboard/server.js` for the Replit dashboard/runtime.

## Route Map

```txt
/                         -> /vvv/index.html
/gate-1                   -> /vvv/gate-1.html
/pools                    -> /vvv/pools.html
/pools/blueprint          -> /vvv/pools-blueprint.html
/pools/onboarding         -> /vvv/pools-onboarding.html
/pools/trust              -> /vvv/pools-trust.html
/pools/ledger             -> /vvv/pools-ledger.html
/pools/governance         -> /vvv/pools-governance.html
/pools/learning           -> /vvv/pools-learning.html
/pools/profile            -> /vvv/pools-profile.html
/pools/compliance         -> /vvv/pools-compliance.html
/admin/pools              -> /vvv/admin-pools.html
/proofbridge              -> /vvv/proofbridge.html
/submission               -> /vvv/submission.html
/api/health               -> /api/verify.js
/api/status               -> /api/verify.js
/api/verify               -> /api/verify.js
/api/mint                 -> /api/mint.js
/api/liquidity-leap/telemetry -> /api/liquidity-leap/telemetry.js
```

## Verification

Run the root smoke tests before production deployment:

```bash
node --test test/gate1-smoke.test.js
npm run build
```

The smoke suite verifies RS256 Gate-1 receipts, MAINNET rejection, and signed Liquidity Leap telemetry ingress.

## DNS

Use `vvv/dns/zone.corrected.bind` and `vvv/dns/zone.updated.txt` as the production DNS source of truth. Both files must keep the apex and `www` records aligned to Vercel.

```txt
@    A     76.76.21.21
www  CNAME cname.vercel-dns.com.
```

## Security

Do not commit `.env`, `.env.*`, private keys, local Vercel output, `dist/`, or `node_modules/`. Keep Vercel, GitHub, wallet, RPC, and telemetry keys in provider secrets only.

## Contact

Vaguely Vanity LLC, Gqeberha, ZA

`hello@venturevisionubuntu.co.za`
