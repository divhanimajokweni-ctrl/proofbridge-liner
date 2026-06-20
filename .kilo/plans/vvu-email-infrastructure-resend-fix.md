# VVU Email Infrastructure — Resend Domain Fix Plan

## Goal
Fix the Resend domain registration (typo `venturevisioubuntu.co.za` → `venturevisionubuntu.co.za`), configure DNS at Host Africa, set the API key in Vercel production env, and wire `hello@venturevisionubuntu.co.za` as the sending address.

---

## Confirmed Inputs
- **Resend API key:** `re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz`
- **Resend region:** `eu-west-1`
- **Sending address:** `hello@venturevisionubuntu.co.za`
- **DNS provider:** Host Africa
- **Correct domain:** `venturevisionubuntu.co.za`

---

## Step 1 — Add RESEND_API_KEY to Vercel Production

```bash
vercel env add RESEND_API_KEY production
# Paste: re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz
```

Verify:
```bash
vercel env ls | grep -i resend
# Expected: RESEND_API_KEY  Encrypted  Production
```

---

## Step 2 — Delete Typo Domain from Resend

```bash
# List domains to get the typo domain's ID
curl -s https://api.resend.com/domains \
  -H "Authorization: Bearer re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz" \
  | jq '.data[] | {id, name, status}'
# Expected: find domain with name `venturevisioubuntu.co.za` and note its `id`

# Delete it
curl -X DELETE https://api.resend.com/domains/<DOMAIN_ID> \
  -H "Authorization: Bearer re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz"
```

---

## Step 3 — Recreate Domain with Correct Name

```bash
curl -X POST https://api.resend.com/domains \
  -H "Authorization: Bearer re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz" \
  -H "Content-Type: application/json" \
  -d '{"name": "venturevisionubuntu.co.za", "region": "eu-west-1"}'
```

Save the response — it contains the DNS records to add (DKIM TXT, SPF TXT, MX).

---

## Step 4 — Add DNS Records at Host Africa

Log in to Host Africa DNS management for `venturevisionubuntu.co.za`. Add each record exactly as returned by Resend in Step 3.

| Type | Host / Name | Value / Target | Priority | TTL |
|------|------------|----------------|----------|-----|
| TXT  | `resend._domainkey` | *(from Resend API response — DKIM public key)* | — | 3600 |
| TXT  | `venturevisionubuntu.co.za` | `v=spf1 include:amazonses.com ~all` | — | 3600 |
| MX   | `venturevisionubuntu.co.za` | `feedback-smtp.eu-west-1.amazonses.com` | 10 | 3600 |
| MX   | `venturevisionubuntu.co.za` | `inbound-smtp.eu-west-1.amazonaws.com` | 10 | 3600 (for receiving) |
| TXT  | `_dmarc` | `v=DMARC1; p=none;` | — | 3600 |

> Note: The underscore in `resend._domainkey` must be preserved. Host Africa DNS panel accepts underscores in TXT record names.

---

## Step 5 — Verify DNS Propagation

```bash
dig TXT venturevisionubuntu.co.za +short
# Expected: v=spf1 include:amazonses.com ~all

dig TXT resend._domainkey.venturevisionubuntu.co.za +short
# Expected: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...(long key)

dig TXT _dmarc.venturevisionubuntu.co.za +short
# Expected: v=DMARC1; p=none;

dig MX venturevisionubuntu.co.za +short
# Expected: both amazonses.com and amazonaws.com MX records
```

Expected propagation time: 5–30 minutes for TXT, up to 48 hours for MX (usually much faster on Host Africa).

---

## Step 6 — Verify Domain in Resend

```bash
curl -X POST https://api.resend.com/domains/venturevisionubuntu.co.za/verify \
  -H "Authorization: Bearer re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz"
```

Expected response: `"status": "verified"` or `"pending_verification"` if DNS not yet propagated.

---

## Step 7 — Test Email Sending

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_NkDC28kZ_66PiUbAiE34wpTCRtd4dzmCz" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "hello@venturevisionubuntu.co.za",
    "to": "divhanimajokweni@gmail.com",
    "subject": "VVU Email Setup Complete",
    "html": "<p>✅ Email is working.</p>"
  }'
```

---

## Step 8 — (Optional) Wire into App

If the Next.js app needs to send email, add a minimal API route:

- File: `app/api/send-email/route.ts`
- Auth: Bearer `KERNEL_SECRET`
- From: `hello@venturevisionubuntu.co.za`
- Library: `resend` npm package (not yet installed — confirm if needed)

---

## Notes
- Receiving (MX inbound routing) is configured at Step 4 and requires Resend receiving to be enabled on the domain. This may need the `inbound-smtp` MX record plus enabling receiving in the Resend dashboard.
- DMARC `p=none` is the safe starting policy. Upgrade to `p=quarantine` once sending is verified clean.
- Host Africa does not require API credentials for DNS changes — all changes are via their control panel or WHM.
