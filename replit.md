# ProofBridge Liner Replit Notes

Replit is the autoscale dashboard/runtime surface for ProofBridge Liner. Vercel serves the public production site at `https://venturevisionubuntu.co.za`.

## Runtime

```txt
Node module: nodejs-20
Workflow: Start application
Workflow command: npm run start
Server: dashboard/server.js
Local port: 5000
Deployment target: autoscale
Deployment run command: node dashboard/server.js
```

## Production Boundary

Replit must not define a different production contract from Vercel. The same route and environment names apply before a production deploy is allowed.

Required runtime environment:

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

## Replit-to-Vercel Deploy Command

```bash
export VERCEL_AUTH_TOKEN=...
export EXPECTED_GIT_BRANCH=main
export EXPECTED_GIT_HEAD=<short-or-full-commit>
export CONFIRM_PROD_DEPLOY=yes
export PRODUCTION_ALIAS_DOMAIN=venturevisionubuntu.co.za
export PRODUCTION_HEALTH_URL=https://venturevisionubuntu.co.za/api/health
npm run deploy:vercel:replit
```

The helper blocks deploy when the branch, commit, clean tree, route contract, Vercel env names, contract addresses, alias state, build, or tests fail.

## Project Layout

```txt
api/                         Vercel serverless API routes
api/lib/receipt-signing.js   Shared RS256 receipt authority
api/liquidity-leap/          Unity telemetry ingress
vvv/                         Production static VVU and Ubuntu Pools pages
dashboard/                   Express dashboard/runtime for Replit
contracts/                   Solidity contracts
proofs/                      Formal verification artifacts
prover/                      Existing JS prover scripts plus TS compliance tokenizer
server/mock_sarb_endpoint.ts Mock SARB compliance ingest endpoint
test/gate1-smoke.test.js     Gate-1 and Liquidity Leap smoke tests
```

## Verification

```bash
npm run build
node --test test/gate1-smoke.test.js
```

The smoke test verifies RS256 receipts, MAINNET rejection, and Liquidity Leap telemetry ingress.

## DNS

Production DNS must align to Vercel:

```txt
venturevisionubuntu.co.za      A      76.76.21.21
www.venturevisionubuntu.co.za  CNAME  cname.vercel-dns.com.
```

The typo domain `venturevisualubuntu.co.za` is not used.

## Security Notes

Do not commit `.env`, private keys, generated PEM files, local Vercel output, `dist/`, `node_modules/`, or `.local` state. Keep operational tokens in provider secrets only.
