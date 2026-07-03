# Deployment Checklist

## Pre-Push
- [ ] All changes committed with meaningful messages
- [ ] Critical files present (verify, mint, middleware, AGENTS.md)

## Build
- [ ] `npm run build` passes without errors
- [ ] ESLint warnings reviewed (non-blocking)

## Deploy
- [ ] Pushed to origin
- [ ] Vercel production deploy succeeded
- [ ] Domain alias active

## Verify
- [ ] DNS resolves correctly
- [ ] Health endpoint responding
- [ ] Email sending/receiving functional

## Docs
- [x] README build reference updated
- [x] DEPLOY_LOG.md entry created
- [x] Documentation files reviewed

---
## Session 2026-07-03 — Signed Off ✅

| Check | Status |
|-------|--------|
| Credential security | ✅ PAT removed from remote URL, `gh` auth helper configured |
| Nav/routing | ✅ Sidebar rebuilt with 14 working links, dead docs links removed |
| Build | ✅ `npm run build` — zero errors |
| Push | ✅ `compliance-fabric` + `main` pushed to origin |
| Vercel deploy | ✅ `dpl_6M2Xatq9NdCa1sVTYiSUw7KdrPTE` — READY |
| Custom domain | ✅ `https://venturevisionubuntu.co.za` — 200 OK |
| Key routes | ✅ `/proofbridge` 200, `/pools` 200, `/gateway` 200, `/api/health` 200 |
| Behavioral coverage | ✅ 4/5 PASS (SafeKrypte: service not running in dev) |
| Critical files | ✅ verify, mint, middleware, AGENTS.md all present |
| Branch integrity | ✅ `compliance-fabric` + `main` in sync |
| DNS nameservers | ⚠️ `venturevisionubuntu.co.za` nameservers point to `host-ww.net`, not `vercel-dns.com`. Update at registrar for full managed DNS.
