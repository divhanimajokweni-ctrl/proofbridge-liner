# Operational Closure Checklist — proofbridge-liner feature/vvu-val-001
## 1. External evidence inputs — put files in place before running propagation

### Gate E evidence files
Place the following in `VVU-VAL-001/evidence/`:
- `popia-audit-report.json`
- `security-audit-report.json`
- `operator-verification.json`

Use the EvidenceEnvelope schema from `src/lib/validation/envelope.ts`.

## 2. GitHub environments and secrets
```bash
bash scripts/setup-github-environments.sh
gh secret set VVU_VAL_KUBECONFIG --env validation --body "$(base64 -w0 < VVU-VAL-001/k8s/kubeconfig.yaml)"
```

## 3. Trigger validation workflow
```bash
MANUAL_HOUR="1" bash scripts/verify-workflow-execution.sh
```
Take the run ID and run:
```bash
bash scripts/close-gate-e.sh <RUN_ID>
bash scripts/rerun-propagation.sh
```

## 4. Populate Gate F and Gate G
Edit:
- `VVU-VAL-001/protocol/gate-f/input.json`
- `VVU-VAL-001/protocol/gate-g/input.json`

Do not set status fields directly. Instead fill evidence inputs that `propagate-evidence.py` reads.

## 5. Re-run propagation
```bash
cd VU-VAL-001/protocol && python propagate-evidence.py
```

## 6. Verify production
```bash
curl -I https://proofbridge-liner-divhanimajokweni-1651s-projects.vercel.app/
for route in / /overview /gates /validation /runtime /evidence /research /deployments /administration; do
  echo "route=$route status=$(curl -s -o /dev/null -w '%{http_code}' https://proofbridge-liner-divhanimajokweni-1651s-projects.vercel.app${route})"
done
```

## 7. Merge gate
Only after all gates PASS and deployments succeed:
```bash
git checkout main
git merge --no-ff feature/vvu-val-001 -m "merge: VVU-VAL-001 final production release"
git tag VAL-001
git push origin main --tags
```
