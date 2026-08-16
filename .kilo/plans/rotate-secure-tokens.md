# Secret Rotation & Hardening Plan

## Context
Last session added agent infrastructure (Mistral bridge, WhatsApp bridge, dispatcher, secret-rotation script). `.vscode/mcp.json` was committed with secrets removed. Remaining exposure: `.env.vercel` (live TFC Atlas token + Vercel OIDC JWT), `.env.production.local` (Etherscan key + real `PRIVATE_KEY`), `.config/gh/hosts.yml` (GitHub PAT), and `.local/share/com.vercel.cli/auth.json` (Vercel CLI token/refresh).

## Scope

### 1. GitHub
- `.config/gh/hosts.yml` — GitHub PAT (rotated)  
  Action: Revoke old PAT in GitHub Settings → Developer settings → Personal access tokens; generate new fine-grained token with `repo:status`, `workflow` scopes; update `hosts.yml`.

### 2. Vercel
- `.env.vercel` — `REDACTED_TFC_TOKEN`, `VERCEL_OIDC_TOKEN`, `KERNEL_SECRET`  
- `.env.production.local` — duplicates of above + `ETHERSCAN_API_KEY`, `PRIVATE_KEY`  
- `.local/share/com.vercel.cli/auth.json` — CLI token + refresh token  
  Action: Inject all values into Vercel project Environment via `vercel env add` or dashboard. Delete workspace copies after migration.

### 3. Blockchain / TEE
- `.env.production.local` — `PRIVATE_KEY` (`0x091f23...`), `ORACLE_PUBLIC_KEY`, `PROOFBRIDGE_RECEIPT_PRIVATE_KEY`  
  Action: Move to HSM/SafeKrypte TEE per AGENTS.md roadmap. Until TEE is ready, require dual human approval and keep keys in `vercel` secret injections, never in workspace files. Do **not** commit any private key material.

### 4. Fail-Closed Fallbacks (Code Fixes)
- `app/api/metrics/gate-a/route.ts:const SECRET = process.env.PROOFBRIDGE_HMAC_SECRET ?? 'dev-secret'`
- `app/api/metrics/gate-c/route.ts:const SECRET = process.env.PROOFBRIDGE_HMAC_SECRET ?? 'dev-secret'`  
  Action: Replace `'dev-secret'` fallback with `throw new Error('PROOFBRIDGE_HMAC_SECRET required')` so missing config fails closed.

### 5. .gitignore Harden
Add to `.gitignore` if missing:
- `.config/`
- `.local/`
- `.vscode/mcp.json` (already present via `.env*`? No — explicitly add `.vscode/mcp.json`)
- `whatsapp-bridge/.env`
- `.env.vercel`
- `.env.production.local`
- `.env.production`

## Execution Steps

1. **Audit & inventory** — Confirm each secret location and rotation availability via provider APIs/CLIs.
2. **Rotate provider tokens first** (GitHub, Vercel, Etherscan) before changing app env.
3. **Migrate workspace env → Vercel secrets** using `vercel env add`.
4. **Fix fail-closed routes** in `gate-a/route.ts` and `gate-c/route.ts`.
5. **Sanitize** — Delete/redact local copies (`.env.vercel`, `.env.production.local`, `.config/gh/hosts.yml`, `.local/share/com.vercel.cli/auth.json`).
6. **Verify** — Run `npm run verify` and `npm run typecheck`; pre-flight must pass.
7. **Pre-commit check** — Run secret scanner; ensure zero matches.

## Constraints
- Do not commit any new secrets or keys.
- Private keys stay out of git; use Vercel secret injection or HSM.
- Treat `vca_` / refresh tokens as credentials — rotate, do not embed.
