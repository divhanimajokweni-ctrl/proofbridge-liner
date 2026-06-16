# POPIA Records of Processing

## Processing Activities

| Processing Activity | Data Categories | Purpose | Retention | Lawful Basis | Sharing |
|---|---|---|---|---|---|
| Membership registration | Name, ID number, email, phone | Identity verification | Membership duration + 5 years | Contract / Legal obligation | Internal only |
| Contribution tracking | Bank details, contribution amounts | Financial record-keeping | 7 years | Legal obligation | Auditor |
| Webhook delivery | Timestamps, event types | Service delivery | 90 days | Contract | Webhook subscribers |
| Dashboard authentication | Session tokens, sea | Access control | Session lifetime | Contract | Supabase |

## Data Subject Rights

- Access
- Correction
- Deletion (erasure)
- Objection to processing
- Portability (machine-readable export)
- Complaint to Information Regulator

## Retention Schedule

| Data Type | Retention Period | Trigger |
|---|---|---|
| Membership records | 7 years | Law: CPA / FICA record-keeping |
| Contribution/payment records | 7 years | Law: Tax Act / FICA |
| System audit logs | 3 years | Internal governance |
| Webhook logs | 90 days | Operational |

## Data Breach Procedure

_See `docs/legal/popia/data-subject-rights-procedure.md` for the incident response procedure._
