# ProofBridge Liner

ProofBridge Liner is the production shell for the Venture Vision Ubuntu / Ubuntu Pools safety kernel. It serves the public VVU experience, pool journey pages, verification API routes, and a new cryptographic compliance execution fabric for SARB/BOP3-style regulatory evidence.

## Current Production State

- Production domain: https://venturevisualubuntu.co.za
- Active clean integration branch: `compliance-fabric`
- Runtime: Next.js 15 App Router on Vercel Edge
- Node.js: 24.x (engines field)
- Middleware: `middleware.ts` (dynamic import for Edge Runtime)

## Architecture

```
app/
├── layout.tsx              Root layout (SessionProvider wrapper)
├── page.tsx                Redirects to /vvv/index.html
├── globals.css             Global styles
├── auth/
│   ├── page.tsx            Magic link sign-in (client)
│   └── callback/route.ts   Supabase code exchange
├── api/
│   ├── verify/route.ts     Gate-1 Bayesian verification (POST)
│   ├── mint/route.ts       Gate-1 v2 mint with nonce (POST)
│   └── contact/route.ts    Contact form via Resend (POST)
└── admin/
    └── pools/page.tsx      Admin pool dashboard (auth-required)

middleware.ts               Edge auth guard (Supabase dynamic import)
next.config.js              Rewrites to /vvv/ static pages
vercel.json                 Vercel config (no rewrites — handled by Next.js)
```

## API Routes

All routes are Next.js App Router handlers in `app/api/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/verify` | POST | Gate-1 Bayesian verification — computes posterior, threshold, verdict |
| `/api/mint` | POST | Gate-1 v2 mint — adds replay protection via client_nonce |
| `/api/contact` | POST | Contact form — sends via Resend API |

### POST /api/verify

```json
{
  "alpha": 10, "beta": 2, "gamma": 1.5, "threshold": 0.7,
  "deed_hash": "64-char-hex", "chain_target": "AMOY"
}
```

### POST /api/mint

```json
{
  "alpha": 10, "beta": 2, "gamma": 1.5, "threshold": 0.7,
  "deed_hash": "64-char-hex", "client_nonce": "64-char-hex",
  "chain_target": "AMOY"
}
```

## Static Routes

Rewrites in `next.config.js` serve static HTML from `public/vvv/`:

```
/                  -> /vvv/index.html
/gate-1            -> /vvv/gate-1.html
/pools             -> /vvv/pools.html
/pools/onboarding  -> /vvv/pools-onboarding.html
/pools/trust       -> /vvv/pools-trust.html
/pools/ledger      -> /vvv/pools-ledger.html
/pools/governance  -> /vvv/pools-governance.html
/pools/learning    -> /vvv/pools-learning.html
/pools/profile     -> /vvv/pools-profile.html
/pools/compliance  -> /vvv/pools-compliance.html
/admin/pools       -> /vvv/admin-pools.html
/proofbridge       -> /vvv/proofbridge.html
/submission        -> /vvv/submission.html
```

## Authentication

- Middleware uses `@supabase/ssr` with dynamic import for Edge Runtime compatibility
- Public routes: `/auth`, `/auth/callback`, `/vvv`, `/demo`, `/gate-1`, `/proofbridge`, `/pools`, `/submission`
- Admin routes: `/admin` — requires `facilitator` role in Supabase user metadata
- Auth pages: `/auth` (magic link), `/auth/callback` (code exchange)

## Deployment

```bash
# Install and build
npm install
npm run build

# Deploy to Vercel
vercel deploy --prod --yes
vercel alias set <deployment-url> venturevisualubuntu.co.za

# Verify
curl -I https://venturevisualubuntu.co.za
curl -I https://venturevisualubuntu.co.za/api/verify
```

Expected: `HTTP/1.1 200 OK`.

## Local Development

```bash
npm install
npm run dev
```

Dev server starts at `http://localhost:3000`.

### QStash Local Development

```bash
npx @upstash/qstash-cli@latest dev
```

Local QStash server runs at `http://127.0.0.1:8080`.

### AI Gateway

The `ai-gateway/` directory contains a standalone Vercel AI Gateway integration:

```bash
cd ai-gateway
npm install
npx tsx index.ts
```

Requires `AI_GATEWAY_API_KEY` in `ai-gateway/.env.local`.

## Cryptographic Compliance Execution Fabric

The TypeScript compliance fabric adds deterministic, signed compliance artifacts.

Core files:

```
prover/compliance_tokenizer.ts       RS256 pool tokens and signed compliance envelopes
server/mock_sarb_endpoint.ts         Mock SARB ingest endpoint for signature verification
scripts/generate_keys.mjs            Local RSA keypair generation
test/verification_loop.test.ts       End-to-end verification loop
```

## Security Notes

- Never embed GitHub, Vercel, wallet, or RPC secrets in committed files
- Treat `private_key.pem`, `.env`, `.env.*`, `dist/`, `node_modules/` as local artifacts
- Middleware degrades gracefully when Supabase env vars are missing
- All API routes validate input and reject malformed requests
