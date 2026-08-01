# VVU Autonomous Partnership Agent — Email Templates & Portal Structures

> **Document ID:** VVU-SPA-001  
> **Revision:** 1.0  
> **Generated:** 2026-08-01 UTC  
> **Evidence Package Version:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC  
> **Status:** Active — Production Specification

---

## 1. URL / Route Architecture

All partnership-facing routes live under the `/hbk` namespace. Authentication is handled via magic-link tokens or session cookies as noted below.

| Route | URL Pattern | Auth Method | Description |
|---|---|---|---|
| Technical briefing (public) | `https://vvu.africa/hbk/briefing` | None | Untracked access to the HBK simulation briefing page. No analytics identity. |
| Technical briefing (tracked) | `https://vvu.africa/hbk/briefing?ref={contact_id}&utm_source=sequenzy` | `ref` param | Tracked access. The `ref` query param maps to a `contact_id` in Sequenzy. Fires `briefing_opened` event. |
| Document signing portal | `https://vvu.africa/hbk/documents/{document_room_id}` | Magic link | One-time magic link sent via email. Grants read + sign access to a specific document room. |
| Dashboard login | `https://vvu.africa/hbk/dashboard/login?token={access_token}` | Magic link → session cookie | Magic link exchanged for a `HttpOnly` session cookie on first load. Token is single-use and expires after 15 minutes. |
| Dashboard (post-auth) | `https://vvu.africa/hbk/dashboard` | Session | Requires active session cookie. Shows live simulation data, gate status, and consortium dashboard. |
| Resource/pledge portal | `https://vvu.africa/hbk/consortium/portal?token={access_token}` | Magic link | One-time magic link. Grants access to the Founding Consortium resource commitment portal. |

### Route Design Principles

- **No permanent secrets in URLs.** Magic-link tokens are single-use, time-bound (15 min TTL), and rotate on each send.
- **`ref` params are for telemetry only.** They do not grant any elevated access.
- **All `/hbk/*` routes** share a common layout shell (VVU header, footer, POPIA consent banner).
- **Session cookies** are `HttpOnly`, `SameSite=Strict`, scoped to `vvu.africa`, and expire after 7 days of inactivity.

---

## 2. AUT-001 — Catalyst Welcome & Briefing

**Trigger:** Contact is added to the "Catalyst" segment in Sequenzy (manual import or form submission).  
**Goal:** Deliver the technical briefing link and establish the first tracked touchpoint.  
**Evidence Ref:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC

### TMPL-001 — Initial Send (t+0)

**Subject:** `Following up on VVU & African Water Security`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Following up on VVU &amp; African Water Security</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          Following up on VVU &amp; African Water Security
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Thank you for your interest in the VVU initiative. The technical briefing
          for the HBK (High-Balance Knapsack) validation simulation is now available.
          It covers the distributed-ledger architecture, water-security modelling,
          and the Founding Consortium framework.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The briefing takes approximately 5 minutes to review and includes
          interactive simulation outputs you can explore.
        </p>
        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                View the Technical Briefing &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link into your browser:<br />
          <a href="https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/briefing?ref={{contact_id}}&amp;utm_source=sequenzy&amp;utm_campaign=aut001_tmpl001
          </a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          You received this because you expressed interest in VVU.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
Following up on VVU & African Water Security

Hi {{contact_first_name}},

Thank you for your interest in the VVU initiative. The technical briefing
for the HBK (High-Balance Knapsack) validation simulation is now available.
It covers the distributed-ledger architecture, water-security modelling,
and the Founding Consortium framework.

The briefing takes approximately 5 minutes to review and includes
interactive simulation outputs you can explore.

View the Technical Briefing:
https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
You received this because you expressed interest in VVU.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:**

| Variable | Source | Description |
|---|---|---|
| `{{contact_first_name}}` | Sequenzy contact field | Recipient's first name |
| `{{contact_id}}` | Sequenzy contact field | Unique contact identifier (used in `ref` param) |
| `{{unsubscribe_url}}` | Sequenzy system | POPIA-compliant one-click unsubscribe URL |

**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-001", contact_id, automaton: "AUT-001" }`

---

### TMPL-001-REMINDER — Reminder (t+48h)

**Condition:** `briefing_opened` event has NOT been recorded for this contact within 48 hours of TMPL-001 send.  
**Subject:** `Still worth 5 minutes: the HBK simulation briefing`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Still worth 5 minutes: the HBK simulation briefing</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          Still worth 5 minutes: the HBK simulation briefing
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          I wanted to make sure this didn't get lost in your inbox. The VVU
          technical briefing is a concise overview of the HBK validation
          simulation — the core proof-of-concept for African water security
          infrastructure financing.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          It's designed to be read in under 5 minutes and includes live
          simulation data you can interact with.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001r"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Open the Briefing &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001r"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/briefing?ref={{contact_id}}&amp;utm_source=sequenzy&amp;utm_campaign=aut001_tmpl001r
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          This is a one-time reminder. No further emails will be sent automatically.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
Still worth 5 minutes: the HBK simulation briefing

Hi {{contact_first_name}},

I wanted to make sure this didn't get lost in your inbox. The VVU
technical briefing is a concise overview of the HBK validation
simulation — the core proof-of-concept for African water security
infrastructure financing.

It's designed to be read in under 5 minutes and includes live
simulation data you can interact with.

Open the Briefing:
https://vvu.africa/hbk/briefing?ref={{contact_id}}&utm_source=sequenzy&utm_campaign=aut001_tmpl001r

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
This is a one-time reminder. No further emails will be sent automatically.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:** Same as TMPL-001.  
**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-001-REMINDER", contact_id, automaton: "AUT-001" }`  
**Terminal Behaviour:** After TMPL-001-REMINDER, no further automated emails fire for AUT-001. If `briefing_opened` is still absent after 14 days, the contact is flagged for `human_review`.

---

## 3. AUT-002 — Tri-Party Agreement Follow-up

**Trigger:** Contact has been granted access to a document room (event: `document_room_created`).  
**Goal:** Prompt the contact to review and sign the tri-party agreement (NDA / MoU).  
**Evidence Ref:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC

### TMPL-002 — Initial Send (t+24h)

**Condition:** 24 hours after `document_room_created` event, and `document_signed` event has NOT been recorded.  
**Subject:** `Want to continue your review?`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Want to continue your review?</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          Want to continue your review?
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The {{document_type}} for the VVU initiative is ready for your
          review and signature. You can access the document through the
          secure signing portal below.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The link is unique to you and will expire after 72 hours for
          security. If you need more time, simply reply to this email.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/documents/{{document_room_id}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Open Document Portal &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/documents/{{document_room_id}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/documents/{{document_room_id}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          This link is unique and time-limited. Do not forward.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
Want to continue your review?

Hi {{contact_first_name}},

The {{document_type}} for the VVU initiative is ready for your
review and signature. You can access the document through the
secure signing portal below.

The link is unique to you and will expire after 72 hours for
security. If you need more time, simply reply to this email.

Open Document Portal:
https://vvu.africa/hbk/documents/{{document_room_id}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
This link is unique and time-limited. Do not forward.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:**

| Variable | Source | Description |
|---|---|---|
| `{{contact_first_name}}` | Sequenzy contact field | Recipient's first name |
| `{{document_type}}` | Document room metadata | Type of document (e.g., "Tri-Party NDA", "Memorandum of Understanding") |
| `{{document_room_id}}` | Document room metadata | Unique identifier for the signing portal |
| `{{unsubscribe_url}}` | Sequenzy system | POPIA-compliant one-click unsubscribe URL |

**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-002", contact_id, automaton: "AUT-002" }`

### Escalation Branch

If `document_signed` is NOT recorded within 7 days of `document_room_created`:

- **No further automated email is sent.**
- The `escalate_to_human` action fires with payload:
  ```json
  {
    "automaton": "AUT-002",
    "contact_id": "{{contact_id}}",
    "document_room_id": "{{document_room_id}}",
    "reason": "document_unsigned_7d",
    "last_template": "TMPL-002"
  }
  ```
- The contact is flagged in Sequenzy with tag `escalation:document-unsigned`.

---

## 4. AUT-003 — Dashboard Access Prompt

**Trigger:** Event `nda_signed` is recorded for the contact.  
**Goal:** Drive the contact to the live simulation dashboard where they can view real-time HBK data.  
**Evidence Ref:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC

### TMPL-003 — Initial Send (t+1h after nda_signed)

**Subject:** `A useful next step: live simulation data`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A useful next step: live simulation data</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          A useful next step: live simulation data
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Now that your NDA is in place, you have access to the VVU
          simulation dashboard. This is where you can explore live HBK
          validation data, review engineering gate progress, and monitor
          consortium activity.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The link below will log you in automatically. It expires in
          15 minutes for security — once authenticated, your session
          will persist for 7 days.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Open Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/dashboard/login?token={{access_token}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          This link is single-use and expires in 15 minutes.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
A useful next step: live simulation data

Hi {{contact_first_name}},

Now that your NDA is in place, you have access to the VVU
simulation dashboard. This is where you can explore live HBK
validation data, review engineering gate progress, and monitor
consortium activity.

The link below will log you in automatically. It expires in
15 minutes for security — once authenticated, your session
will persist for 7 days.

Open Dashboard:
https://vvu.africa/hbk/dashboard/login?token={{access_token}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
This link is single-use and expires in 15 minutes.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:**

| Variable | Source | Description |
|---|---|---|
| `{{contact_first_name}}` | Sequenzy contact field | Recipient's first name |
| `{{access_token}}` | Auth service | Single-use magic-link token (15 min TTL) |
| `{{unsubscribe_url}}` | Sequenzy system | POPIA-compliant one-click unsubscribe URL |

**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-003", contact_id, automaton: "AUT-003" }`

---

### TMPL-003-REMINDER — Reminder (t+48h after TMPL-003)

**Condition:** `dashboard_first_view` event has NOT been recorded within 48 hours of TMPL-003 send.  
**Subject:** `The dashboard link from earlier this week`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>The dashboard link from earlier this week</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          The dashboard link from earlier this week
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The original dashboard link has expired, but here's a fresh one.
          The VVU simulation dashboard gives you direct access to HBK
          validation outputs, gate statuses, and consortium resource
          tracking.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Open Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/dashboard/login?token={{access_token}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          No further automated reminders will be sent for dashboard access.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
The dashboard link from earlier this week

Hi {{contact_first_name}},

The original dashboard link has expired, but here's a fresh one.
The VVU simulation dashboard gives you direct access to HBK
validation outputs, gate statuses, and consortium resource
tracking.

Open Dashboard:
https://vvu.africa/hbk/dashboard/login?token={{access_token}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
No further automated reminders will be sent for dashboard access.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:** Same as TMPL-003 (fresh `{{access_token}}` is generated).  
**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-003-REMINDER", contact_id, automaton: "AUT-003" }`  
**Terminal Behaviour:** No further automated emails for AUT-003. Contact is not escalated — dashboard access remains available via manual login.

---

## 5. AUT-004 — Resource Commitment Recovery

**Trigger:** Event `resource_pledge_stalled` is recorded (contact pledged a resource but has not confirmed/finalised within the expected window).  
**Goal:** Recover stalled resource commitments and, if unsuccessful, escalate gracefully.  
**Evidence Ref:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC

### TMPL-004 — Initial Recovery (t+0 on resource_pledge_stalled)

**Subject:** `Update on your Founding Consortium contribution`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Update on your Founding Consortium contribution</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          Update on your Founding Consortium contribution
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          We noticed that your pledged contribution —
          <strong>{{pledged_resource_name}}</strong> — hasn't been
          finalised yet. The Founding Consortium portal is still open
          and ready for you to complete the commitment process.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          If your circumstances have changed or you'd like to discuss
          alternatives, reply to this email and we'll find a path
          forward.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/consortium/portal?token={{access_token}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Complete Your Contribution &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/consortium/portal?token={{access_token}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/consortium/portal?token={{access_token}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
Update on your Founding Consortium contribution

Hi {{contact_first_name}},

We noticed that your pledged contribution — {{pledged_resource_name}} —
hasn't been finalised yet. The Founding Consortium portal is still open
and ready for you to complete the commitment process.

If your circumstances have changed or you'd like to discuss
alternatives, reply to this email and we'll find a path forward.

Complete Your Contribution:
https://vvu.africa/hbk/consortium/portal?token={{access_token}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
Unsubscribe: {{unsubscribe_url}}
```

**Variables:**

| Variable | Source | Description |
|---|---|---|
| `{{contact_first_name}}` | Sequenzy contact field | Recipient's first name |
| `{{pledged_resource_name}}` | Consortium pledge record | Human-readable name of the pledged resource |
| `{{access_token}}` | Auth service | Single-use magic-link token for consortium portal |
| `{{unsubscribe_url}}` | Sequenzy system | POPIA-compliant one-click unsubscribe URL |

**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-004", contact_id, automaton: "AUT-004" }`

---

### TMPL-004-FINAL — Final Check-in (t+7d)

**Condition:** `resource_pledge_confirmed` event has NOT been recorded within 7 days of TMPL-004 send.  
**Subject:** `Last check-in: {{pledged_resource_name}}`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Last check-in: {{pledged_resource_name}}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          Last check-in: {{pledged_resource_name}}
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          This is the last automated follow-up regarding your pledged
          contribution of <strong>{{pledged_resource_name}}</strong>.
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          The portal remains open if you'd like to finalise at your
          convenience. Alternatively, if you'd prefer to withdraw or
          modify your pledge, just reply to this email.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/consortium/portal?token={{access_token}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Open Consortium Portal &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/consortium/portal?token={{access_token}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/consortium/portal?token={{access_token}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          No further automated emails will be sent for this pledge.
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
Last check-in: {{pledged_resource_name}}

Hi {{contact_first_name}},

This is the last automated follow-up regarding your pledged
contribution of {{pledged_resource_name}}.

The portal remains open if you'd like to finalise at your
convenience. Alternatively, if you'd prefer to withdraw or
modify your pledge, just reply to this email.

Open Consortium Portal:
https://vvu.africa/hbk/consortium/portal?token={{access_token}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
No further automated emails will be sent for this pledge.
Unsubscribe: {{unsubscribe_url}}
```

**Variables:** Same as TMPL-004 (fresh `{{access_token}}` generated).  
**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-004-FINAL", contact_id, automaton: "AUT-004" }`

### Escalation Branch

If `resource_pledge_confirmed` is NOT recorded within a further 7 days (14 days total from `resource_pledge_stalled`):

- **No further automated email.**
- `escalate_to_human` fires with payload:
  ```json
  {
    "automaton": "AUT-004",
    "contact_id": "{{contact_id}}",
    "pledged_resource_name": "{{pledged_resource_name}}",
    "reason": "resource_pledge_stalled_14d",
    "last_template": "TMPL-004-FINAL"
  }
  ```
- Contact is tagged `escalation:pledge-stalled` in Sequenzy.

---

## 6. AUT-005 — Institutional Inactivity Check-in

**Trigger:** Contact has not generated any tracked event (`briefing_opened`, `document_signed`, `dashboard_first_view`, `resource_pledge_confirmed`) for 21 consecutive days.  
**Goal:** Gently re-engage inactive institutional contacts without being intrusive.  
**Evidence Ref:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC

### TMPL-005 — Inactivity Check-in (on 21-day inactivity)

**Subject:** `A quick update on the HBK validation`

**HTML Body:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A quick update on the HBK validation</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <tr>
      <td style="padding:32px 40px 0 40px;">
        <p style="margin:0;font-size:14px;color:#6b7280;">Venture Vision Ubuntu</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;color:#111827;font-weight:600;">
          A quick update on the HBK validation
        </h1>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Hi {{contact_first_name}},
        </p>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          A few things have moved forward since your last visit:
        </p>
        <ul style="margin:0 0 12px 0;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
          <li>HBK simulation milestone: {{latest_milestone}}</li>
          <li>New engineering gates passed: {{gates_passed_since}}</li>
          <li>Consortium status update available</li>
        </ul>
        <p style="margin:0 0 12px 0;font-size:15px;color:#374151;line-height:1.6;">
          Your dashboard has all the latest figures.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td style="background:#0b3d2e;border-radius:6px;padding:14px 28px;">
              <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
                 style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                View Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;font-size:13px;color:#6b7280;line-height:1.5;">
          Or copy this link:<br />
          <a href="https://vvu.africa/hbk/dashboard/login?token={{access_token}}"
             style="color:#0b3d2e;word-break:break-all;">
            https://vvu.africa/hbk/dashboard/login?token={{access_token}}
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 32px 40px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;">
          Venture Vision Ubuntu &middot; hello@venturevisionubuntu.co.za
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <a href="{{unsubscribe_url}}" style="color:#0b3d2e;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plaintext Body:**

```
A quick update on the HBK validation

Hi {{contact_first_name}},

A few things have moved forward since your last visit:

- HBK simulation milestone: {{latest_milestone}}
- New engineering gates passed: {{gates_passed_since}}
- Consortium status update available

Your dashboard has all the latest figures.

View Dashboard:
https://vvu.africa/hbk/dashboard/login?token={{access_token}}

---
Venture Vision Ubuntu · hello@venturevisionubuntu.co.za
Unsubscribe: {{unsubscribe_url}}
```

**Variables:**

| Variable | Source | Description |
|---|---|---|
| `{{contact_first_name}}` | Sequenzy contact field | Recipient's first name |
| `{{latest_milestone}}` | HBK simulation state | Most recent milestone label |
| `{{gates_passed_since}}` | Engineering gate ledger | Count of gates passed since contact's last activity |
| `{{access_token}}` | Auth service | Single-use magic-link token for dashboard |
| `{{unsubscribe_url}}` | Sequenzy system | POPIA-compliant one-click unsubscribe URL |

**Event Fired on Send:** `email_sent` with payload `{ template: "TMPL-005", contact_id, automaton: "AUT-005" }`

### Cadence-Reduction Branch

After TMPL-005 fires once at 21 days:

- If the contact remains inactive, the **next check-in is delayed to 30 days** (not 21).
- If still inactive after that 30-day cycle, **no further automated email**.
- Instead, `flag_for_human_review` fires with payload:
  ```json
  {
    "automaton": "AUT-005",
    "contact_id": "{{contact_id}}",
    "reason": "institutional_inactivity_51d",
    "days_inactive": 51,
    "last_template": "TMPL-005"
  }
  ```
- Contact is tagged `flag:human-review` in Sequenzy.

---

## 7. Portal Page Structures

### 7.1 Technical Briefing Page — `/hbk/briefing`

**URL:** `https://vvu.africa/hbk/briefing[?ref={contact_id}&utm_source=sequenzy]`

**Sections (in order):**

1. **Hero Banner** — "HBK Simulation: Technical Briefing" with VVU branding and a brief one-line summary.
2. **Executive Summary** — 2–3 paragraph overview of the HBK validation simulation, its purpose, and the African water security context.
3. **Architecture Overview** — Visual diagram (SVG/interactive) of the distributed-ledger architecture, node topology, and data flow.
4. **Simulation Methodology** — Description of the High-Balance Knapsack model, constraints, and solution approach.
5. **Water Security Modelling** — How the simulation maps to real-world water infrastructure financing scenarios.
6. **Consortium Framework** — Overview of the Founding Consortium structure, roles, and resource categories.
7. **Live Simulation Preview** — Embedded interactive widget showing current HBK simulation outputs (read-only if unauthenticated).
8. **Engineering Gate Summary** — Table of gates G-01 through G-10 with current pass/fail status.
9. **Next Steps CTA** — "Request access to the full dashboard" button, linking to contact form or Sequenzy entry point.

**Behaviour:**

- If `ref` query param is present, the page fires `briefing_opened` event on load with payload `{ contact_id, utm_source }`.
- If no `ref` param, the page loads normally with no tracking identity.
- Page is fully responsive and works without JavaScript (progressive enhancement for the interactive widget).
- Scroll depth is tracked at 25%, 50%, 75%, and 100% thresholds (fires `briefing_scroll_depth` events).

**Events Fired:**

| Event | Trigger | Payload |
|---|---|---|
| `briefing_opened` | Page load with `ref` param | `{ contact_id, utm_source }` |
| `briefing_scroll_depth` | Scroll threshold crossed | `{ contact_id, depth: 25|50|75|100 }` |
| `briefing_cta_clicked` | "Next Steps" CTA clicked | `{ contact_id, cta_target }` |

---

### 7.2 Document Signing Portal — `/hbk/documents/{document_room_id}`

**URL:** `https://vvu.africa/hbk/documents/{document_room_id}`

**Auth Gate:**

- Access requires a valid magic-link token in the user's session or a direct magic-link URL.
- If no valid auth, display: "This document requires a secure link. Check your email for the access link, or contact hello@venturevisionubuntu.co.za."
- Magic link is single-use and expires after 72 hours.

**Sections (in order):**

1. **Document Room Header** — Document type (NDA / MoU / Tri-Party Agreement), document title, and revision info.
2. **Party Identification** — List of signing parties with roles (e.g., "VVU — Initiator", "Institution A — Partner", "Institution B — Partner").
3. **Document Viewer** — Full document rendered in an embedded viewer (PDF.js or equivalent). Supports scroll, zoom, and download.
4. **Signature Block** — Per-party signature area:
   - Full legal name (pre-filled from contact data)
   - Title / designation
   - Date (auto-populated)
   - Signature input (typed or drawn)
   - "Sign" button
5. **Post-Sign Confirmation** — After signing, display: "Your signature has been recorded. A confirmation has been sent to {{contact_email}}." Fire `document_signed` event.
6. **Audit Trail** — Timestamped log of all views and signatures (visible to all parties).

**Behaviour:**

- The document viewer loads the document from encrypted storage (S3 + KMS).
- Signature data is stored as a hashed entry in the VVU ledger (not as an image file).
- After all parties have signed, fire `agreement_fully_executed` event.
- The page is not indexable by search engines (`noindex, nofollow`).

**Events Fired:**

| Event | Trigger | Payload |
|---|---|---|
| `document_viewed` | Page load (authenticated) | `{ contact_id, document_room_id }` |
| `document_signed` | Signature submitted | `{ contact_id, document_room_id, signed_at }` |
| `agreement_fully_executed` | All parties signed | `{ document_room_id, parties: [...] }` |

---

### 7.3 Dashboard Login — `/hbk/dashboard/login`

**URL:** `https://vvu.africa/hbk/dashboard/login[?token={access_token}]`

**Auth Gate:**

- If `token` query param is present:
  1. Validate the token (exists, not expired, not used).
  2. Mark token as used (single-use).
  3. Create session: set `HttpOnly` session cookie scoped to `vvu.africa`, expiry 7 days.
  4. Redirect to `/hbk/dashboard`.
- If no `token` param or token is invalid/expired:
  - Display login page with email input: "Enter your email to receive a new dashboard link."
  - On submit, generate a new magic-link token and send TMPL-003 (manual re-auth flow).

**Landing (post-auth redirect to `/hbk/dashboard`):**

1. **Dashboard Header** — VVU branding, contact name, session indicator.
2. **HBK Simulation Status** — Current simulation state, last run timestamp, key metrics.
3. **Engineering Gates** — Visual progress bar / table for G-01 through G-10.
4. **Consortium Activity** — Recent pledges, resource commitments, member status.
5. **Document Status** — Signed / pending documents for this contact.
6. **Quick Actions** — Links to consortium portal, document rooms, briefing page.

**Session Handling:**

- Session cookie: `HttpOnly`, `SameSite=Strict`, `Secure`, `Path=/hbk`, `Max-Age=604800` (7 days).
- On session expiry, the user is redirected to `/hbk/dashboard/login` (no token param) and sees the email input form.
- Session is invalidated on explicit logout.

**Events Fired:**

| Event | Trigger | Payload |
|---|---|---|
| `dashboard_login` | Magic link token exchanged | `{ contact_id, method: "magic_link" }` |
| `dashboard_first_view` | First page view in a new session | `{ contact_id }` |
| `dashboard_logout` | Explicit logout | `{ contact_id }` |

---

## 8. Implementation Notes

### 8.1 Fallback Strings

All template variables MUST have fallback values to prevent broken rendering:

| Variable | Fallback | Rationale |
|---|---|---|
| `{{contact_first_name}}` | `"there"` | Avoids "Hi ," — renders as "Hi there," |
| `{{document_type}}` | `"the agreement document"` | Generic but functional |
| `{{pledged_resource_name}}` | `"your pledged resource"` | Generic but functional |
| `{{latest_milestone}}` | `"Latest simulation update available"` | Actionable without specifics |
| `{{gates_passed_since}}` | `"N/A"` | Indicates no recent gate activity |

### 8.2 Token Scoping

- **Magic-link tokens** are scoped to a specific action (dashboard login, document room access, consortium portal). A token for one route MUST NOT grant access to another.
- Tokens are single-use. Once exchanged for a session or used to access a resource, they are invalidated immediately.
- Token TTL:
  - Dashboard login: 15 minutes
  - Document room: 72 hours
  - Consortium portal: 24 hours
- Tokens are cryptographically random (256-bit) and stored hashed in the database. The plaintext token is only ever in the URL and email.

### 8.3 No Dollar Figures

- **No email template or portal page shall contain specific dollar amounts, valuations, or financial projections.**
- Resource contributions are described by category (e.g., "computing infrastructure", "domain expertise", "data access") — never by monetary value.
- This is a compliance requirement to avoid inadvertent securities representations.

### 8.4 Ledger Entries

Every automated action (email send, event fire, token create, escalation) MUST create an entry in the VVU automation ledger:

```
{
  "ledger_id": "uuidv4",
  "timestamp": "2026-08-01T12:00:00Z",
  "automaton": "AUT-001",
  "template": "TMPL-001",
  "contact_id": "...",
  "action": "email_sent",
  "payload": { ... },
  "evidence_ref": "VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC"
}
```

Ledger entries are append-only (no updates, no deletes) and are the authoritative record for audit and compliance.

---

## 9. Evidence Versioning

Every template and portal page MUST reference the current evidence package version in its footer, metadata, and ledger entries.

**Format:**

```
VVU-EVD-{number} Rev {revision} Generated: {YYYY-MM-DD} UTC
```

**Current:** `VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC`

**Versioning Rules:**

1. A new revision is created whenever any template body, variable, or portal structure is modified.
2. The revision number increments by 0.1 for non-breaking changes (typo fixes, fallback string updates).
3. The revision number increments by 1.0 for breaking changes (variable renamed, URL changed, auth method changed).
4. The `Generated` date is always updated to the date of the revision.
5. All previous revisions are archived and accessible for audit purposes.

**Where the evidence version appears:**

- HTML email footer (small text, below unsubscribe link)
- Portal page `<meta>` tag: `<meta name="vvu-evidence-version" content="VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC" />`
- Every ledger entry (see §8.4)
- Sequenzy contact timeline metadata

---

## 10. Suggested Improvements

### 10.1 Escalation Gap Analysis

Currently, AUT-002 escalates at 7 days and AUT-004 at 14 days. There is a gap between the last automated email and the escalation event where the contact receives no communication. **Suggestion:** Add a "soft nudge" email at the midpoint (AUT-002: 3.5 days, AUT-004: 7 days) that is even briefer — a single-sentence check-in with no CTA button, just a reply-to prompt.

### 10.2 Conditional Templating

Currently, templates use simple variable substitution. **Suggestion:** Implement conditional blocks so that, for example, TMPL-005 can omit the "New engineering gates passed" bullet if `{{gates_passed_since}}` is zero, avoiding an unhelpful "0 gates" line. This could be achieved with a lightweight template engine (e.g., Handlebars-style `{{#if}}` blocks) in the Sequenzy send pipeline.

### 10.3 Free / Gated Telemetry Split

The briefing page currently tracks all visitors with a `ref` param. **Suggestion:** Split telemetry into two tiers:
- **Free (no `ref`):** Track aggregate page views, scroll depth distributions, and CTA click rates — no individual identity.
- **Gated (with `ref`):** Full individual-level tracking as currently implemented.

This reduces privacy exposure for casual visitors and simplifies POPIA compliance for the anonymous tier.

### 10.4 POPIA Opt-Out

All emails include an unsubscribe link, but the current implementation is a simple "unsubscribe from this list" action. **Suggestion:** Implement a full POPIA opt-out flow:
1. Unsubscribe link leads to a preference page (not an immediate unsubscribe).
2. The preference page offers: (a) unsubscribe from this specific automaton, (b) unsubscribe from all VVU automated emails, (c) request data deletion (POPIA §24(1)), (d) request data export (POPIA §23(1)).
3. Data deletion requests are logged and escalated to `divh@venturevisionubuntu.co.za` for manual processing within 30 days (POPIA requirement).

### 10.5 Template Preview & Test Mode

**Suggestion:** Add a `/hbk/admin/templates` route (auth-gated to VVU team only) that renders any template with sample data. This allows non-technical team members to review email content before automata go live, and supports A/B preview for subject-line testing.

### 10.6 Rate Limiting on Magic-Link Generation

**Suggestion:** Implement rate limiting on the `/hbk/dashboard/login` email-request form. A maximum of 3 magic-link requests per email address per hour prevents abuse while allowing legitimate re-authentication.

---

> **End of Specification**  
> **Document ID:** VVU-SPA-001 Rev 1.0  
> **Evidence Package:** VVU-EVD-001 Rev 1.4 Generated: 2026-08-01 UTC
