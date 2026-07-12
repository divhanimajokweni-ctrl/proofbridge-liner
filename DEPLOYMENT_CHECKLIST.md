# Deployment Checklist

## Pre-Flight (EXECUTE END TO END — verified before pipeline starts)
- [ ] Dev server running on port 3000 (`curl localhost:3000/api/health` → 200)
- [ ] SafeKrypte service reachable on port 5096
- [ ] Vercel CLI installed and authenticated (`vercel whoami` succeeds)
- [ ] Vercel project linked (`.vercel/repo.json` exists with valid project ID)
- [ ] Environment variables present in `.env.local`
- [ ] Network available for DNS checks, health checks, Vercel build

## Pre-Push Gates (ALL must pass before push)
- [ ] Commit exists and critical files present
- [ ] TypeScript typecheck (`tsc --noEmit`) — zero type errors
- [ ] Lint (`npm run lint`) — zero errors
- [ ] Unit tests (`npm test`) — all passing
- [ ] Production build (`npm run build`) — zero errors
- [ ] Behavioral coverage (5 compliance flows) — all PASS or SKIP, none FAIL
- [ ] Vercel production build (`vercel deploy --prod --force`) — succeeds

## Pre-Push Execution (only after gates pass)
- [ ] `git push origin` — pushed to remote

## Post-Deploy Verification
- [ ] DNS resolves correctly
- [ ] Health endpoint responding (HTTP 200)
- [ ] Secrets check passed

## Docs
- [ ] README build reference updated
- [ ] DEPLOY_LOG.md entry created
- [ ] DEPLOYMENT_CHECKLIST.md regenerated
- [ ] Documentation files reviewed
