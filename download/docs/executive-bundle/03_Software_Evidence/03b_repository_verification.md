# Repository Verification Report

**Date:** 2026-08-26
**Repository:** github.com/divhanimajokweni-ctrl/proofbridge-liner
**Branch:** feat/vvu-gov-deploy
**Custom Domain:** vvu-gov.space-z.ai

---

## Verification Checks

| Check | Result |
|---|---|
| Branch | feat/vvu-gov-deploy on GitHub |
| Last commit hash | Verified |
| Build passes | ✅ Next.js 16 compiles |
| Lint | ✅ 0 errors, 0 warnings |
| Console errors | ✅ 0 |
| Routes healthy | ✅ All routes 200 |
| Reproducible evidence | ✅ setup.sh + run.sh → /evidence |
| Custom domain | vvu-gov.space-z.ai |

## Reproducible Build

```bash
git clone https://github.com/divhanimajokweni-ctrl/proofbridge-liner.git
cd proofbridge-liner
git checkout feat/vvu-gov-deploy
bun install
bun run dev
# → http://localhost:3000
```

## Sandbox Pipeline

```bash
cd /sandbox
./setup.sh
cd pipeline
./run.sh
# → /evidence/leak_candidate_audit.json
```
