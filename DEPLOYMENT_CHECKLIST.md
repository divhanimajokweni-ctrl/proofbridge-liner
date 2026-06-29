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
- [ ] README build reference updated
- [ ] DEPLOY_LOG.md entry created
- [ ] Documentation files reviewed
