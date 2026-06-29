# KILOCODE_CONTEXT.md | DO NOT HALLUCINATE. READ FIRST.
Last Updated: 2026-06-28T21:39Z | By: Lindiwe

## 1. CURRENT TRUTH [Copy/Paste Only]
- MODE: nextjs | PORT: 3000 (dev) / 3456 (whatsapp-bridge) / 18789 (openclaw gateway)
- PROOFBRIDGE_HMAC_SECRET: In Vercel env only, not local. Do not require at build time.
- WHATSAPP_BRIDGE: Authenticated and ready on port 3456
- OPENCLAW_GATEWAY: Running on port 18789
- OPENCLAW_CHANNELS: whatsapp [configured], slack [configured-not authed], googlechat [configured-not authed]
- MCP: gcp-mcp-server configured in openclaw.json
- BUILD: Success. gate-a, gate-c are `λ (Dynamic)`.
- FILES_EXIST: KILOCODE_CONTEXT.md, LINDIWE_WORKING_AGREEMENT.md, src/ctosync.py, mcp/gcp-server.yaml, openclaw.json, next.config.mjs, app/api/metrics/gate-a/route.ts, app/api/metrics/gate-c/route.ts, whatsapp-bridge/server.js

## 2. LAST DECISION LOG [Why we did X]
- 2026-06-28: Moved PROOFBRIDGE_HMAC_SECRET check into getSecret() function at handler scope. Reason: Build was failing because env var only exists in Vercel, not at build time.
- 2026-06-28: Added `export const dynamic = 'force-dynamic'` to gate-a and gate-c. Reason: Next.js 14 was prerendering them at build time, causing build failure.
- 2026-06-28: Changed .replit workflow from `npm run start` to `npm run dev`. Reason: Production start requires build artifacts that don't exist in dev workflow.
- 2026-06-28: Installed `qrcode` npm package in whatsapp-bridge/, fixed `/qr/image` to generate proper PNG. Reason: Bridge returned text/plain instead of image/png.
- 2026-06-28: WhatsApp bridge authenticated. Session stored in whatsapp-bridge/.wwebjs_auth/.

## 3. BLOCKED / TODO [Your only task list]
- [x] openclaw gateway run — gateway live on port 18789
- [x] Plugins installed: slack, googlechat, whatsapp
- [x] Gateway config: auth token set, 8 plugins loaded
- [ ] Priority 1: openclaw channels add --channel slack (requires OAuth, browser popup)
- [ ] Priority 2: openclaw channels add --channel googlechat (requires GCP service account at auth/gcp.json)
- [ ] Priority 3: CREATE GROUPS NATIVELY in Slack (#vvu-war-room) and Google Chat, then openclaw discovers them via `directory groups list`
- [ ] Priority 4: openclaw mcp add --config ./mcp/gcp-server.yaml
- [ ] Priority 5: Email (SMTP) and Linear — NOT native. Workaround: Slack integrations.
- [ ] Priority 6: openclaw agent start lindiwe --group <group-id>
- [ ] Priority 7: Install Python in Nix for ctosync.py

## 4. DO NOT INVENT
- Do not create new env vars. Only use those in .env.example
- Some secrets are in Replit Secrets Manager, NOT in any .env file. Do not expect them locally.
- PROOFBRIDGE_HMAC_SECRET: In Vercel env + Replit Secrets, not local .env. Use getSecret() pattern.
- Do not change port 3000 (Next.js) or 3456 (whatsapp-bridge).
- Do not re-add module-level `throw` for PROOFBRIDGE_HMAC_SECRET. Use getSecret() pattern.
- Do not touch .replit deployment run without explicit approval.

If unsure: `curl http://localhost:3456/health` or ask Lindiwe in #vvu-war-room

## 7. WAR ROOM STATUS: LIVE 2026-06-28
- Gateway: ✅ Running on port 18789 with auth token
- Plugins installed: whatsapp, slack, googlechat
- Channels: whatsapp [needs login], slack [needs OAuth], googlechat [needs GCP JSON]
- MCP: gcp-mcp-server [config ready, needs `openclaw mcp add`]
- Group: create natively in each platform, then openclaw discovers via `directory groups list`
- NOTE: `openclaw directory group create` does NOT exist. Use native platform group creation.
- NEXT: Auth channels, register MCP, start agents

## 6. MCP: GCP BRAIN [Do not invent tools]
- MCP_SERVER: gcp-mcp-server | ACTIVE in openclaw.json
- TOOLS: gcloud_exec, terraform_exec, gemini_cli, datadog_alert
- RBAC: Mino+Core=write. Lindiwe=read-only.
- PROJECT_ID: vvu-prod-2026
- DO NOT RUN: terraform destroy without Mino approval
