# GCP Workload Identity Federation Setup — VVU

**Goal:** Replace static `auth/gcp.json` service account key with tokenless
OIDC federation from Vercel.

**Updated:** 2026-06-29

---

## Architecture

```
Vercel Deployment
  │  OIDC token (auto, no config)
  │  iss=https://oidc.vercel.com
  │  sub=<project-id>:<environment>
  ▼
GCP Workload Identity Pool  ←── Pool Provider (OIDC → Vercel)
  │  exchanges OIDC → GCP access token
  ▼
Service Account (impersonation)  OR  Direct resource access
  │
  ▼
Google Chat API  │  GCP APIs
```

- **No static keys** on disk or in env vars.
- Vercel injects the OIDC token at build/runtime automatically via
  `VERCEL_OIDC_TOKEN` env var.
- `google-auth-library` picks it up transparently when
  `GOOGLE_APPLICATION_CREDENTIALS` is unset and `GCP_PROJECT_ID` is set.

---

## Prerequisites

| Item | Status |
|------|--------|
| GCP project `vvu-prod-2026` | ✅ exists (from `openclaw.json`) |
| Billing enabled | Must verify |
| IAM API enabled (`iam.googleapis.com`) | Required |
| Cloud Resource Manager API enabled | Required |
| Vercel project ID (from dashboard → Settings → General) | Needed |
| Vercel team ID (if team; else personal) | Needed |

---

## Step 1 — Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "vvu-vercel-pool" \
  --project="vvu-prod-2026" \
  --location="global" \
  --display-name="VVU Vercel Deployments"
```

---

## Step 2 — Create OIDC Provider (trust Vercel)

```bash
gcloud iam workload-identity-pools providers create-oidc "vercel-oidc" \
  --project="vvu-prod-2026" \
  --location="global" \
  --workload-identity-pool="vvu-vercel-pool" \
  --issuer-uri="https://oidc.vercel.com" \
  --attribute-mapping="google.subject=assertion.sub" \
  --attribute-condition="assertion.sub.startsWith('prj_')"
```

Vercel's OIDC token `sub` claim format:
```
<project-id>:<environment>
```
e.g. `prj_abc123:production`

The attribute condition above ensures only Vercel subjects (prefixed `prj_`)
can authenticate — blocks any other OIDC issuer that happens to use the
same issuer URL.

> **Why `google.subject=assertion.sub`:** `sub` is unique per Vercel
> deployment environment. You get one principal per project+env combination.

---

## Step 3 — Grant Pool Access to GCP Resources

### Option A — Direct resource access (recommended for Chat API)

```bash
gcloud projects add-iam-policy-binding "vvu-prod-2026" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vvu-vercel-pool/*" \
  --role="roles/chat.botUser"
```

Replace `PROJECT_NUMBER` with the numeric project number (NOT `vvu-prod-2026`).

### Option B — Service account impersonation

```bash
# Create a dedicated service account for the workload
gcloud iam service-accounts create "vvu-vercel-worker" \
  --project="vvu-prod-2026" \
  --display-name="VVU Vercel Worker"

# Grant the pool the ability to impersonate it
gcloud iam service-accounts add-iam-policy-binding \
  "vvu-vercel-worker@vvu-prod-2026.iam.gserviceaccount.com" \
  --project="vvu-prod-2026" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/vvu-vercel-pool/*"

# Then grant the SA whatever roles it needs
gcloud projects add-iam-policy-binding "vvu-prod-2026" \
  --member="serviceAccount:vvu-vercel-worker@vvu-prod-2026.iam.gserviceaccount.com" \
  --role="roles/chat.botUser"
```

---

## Step 4 — Update Vercel Environment

Set `GCP_PROJECT_ID=vvu-prod-2026` in Vercel project environment variables.

Remove `GOOGLE_APPLICATION_CREDENTIALS` if set — the library auto-detects
WIF when running on Vercel.

### Vercel OIDC Token

Vercel injects `VERCEL_OIDC_TOKEN` automatically in **Production** and
**Preview** deployments if the Vercel OIDC integration is enabled:

1. Go to Vercel Dashboard → Project → Settings → Deployment
2. Enable "OIDC Token" (if not already on)
3. No code changes needed — `google-auth-library` reads
   `VERCEL_OIDC_TOKEN` automatically via `GcpMetadata` / ADC.

---

## Step 5 — Update openclaw MCP Config

Remove the static key path from `mcp/gcp-server.yaml`:

```diff
 env:
-  GOOGLE_APPLICATION_CREDENTIALS: "./auth/gcp.json"
   GCP_PROJECT_ID: "${GCP_PROJECT_ID}"
```

The GCP client library will use Application Default Credentials, which on
Vercel resolves through WIF (OIDC → STS → access token).

---

## Verification

Deploy to Vercel production, then test GCP access from the deployment:

```bash
# SSH into a Vercel function or hit a test endpoint
curl -H "Authorization: Bearer $KERNEL_SECRET" \
  https://venturevisionubuntu.co.za/api/verify-gcp
```

The `google-auth-library` will:
1. Detect `VERCEL_OIDC_TOKEN` env var
2. Exchange it with GCP STS for an access token
3. Authenticate API calls transparently

---

## Rollback

If WIF fails:
1. Re-add `GOOGLE_APPLICATION_CREDENTIALS: "./auth/gcp.json"` to
   `mcp/gcp-server.yaml`
2. Ensure `auth/gcp.json` exists in the deployment
3. Redeploy via `npx vercel --prod --force`

---

## References

- [GCP WIF docs](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Vercel OIDC docs](https://vercel.com/docs/deployments/oidc-tokens)
- [google-auth-library ADC](https://github.com/googleapis/google-auth-library-nodejs#application-default-credentials)
