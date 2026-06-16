# Privacy Impact Assessment

## Assessment Scope

Ubuntu Pools web platform — contribution intake, receipt issuance, dashboard access, telemetry collection.

## Data Flows

```
Member → Web Form → Supabase Auth → Database → ProofBridge (receipt) → Member
Member → Dashboard → WebSocket / polling → Ledger display
Admin → Admin panel → Audit log export
```

## Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Unauthorised database access | Low | High | Supabase RLS, session isolation |
| Receipt payload exposure | Low | Medium | HMAC-signed receipts only |
| Cross-admin escalation | Low | High | Role enforcement in middleware |
| Telemetry over-collection | Low | Low | OTel sampling controls |
| Webhook exposure of PII | Low | High | No PII in webhook payloads |

## Residual Risk

Residual risks are acceptable pending FSP licence and formal POPIA Information Officer appointment. This assessment must be reviewed after M0.

_This document requires Information Officer sign-off before commercial launch._
