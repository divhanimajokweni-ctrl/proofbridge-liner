# Risk Management and Compliance Programme

## Purpose

This RMCP satisfies the Financial Intelligence Centre Act 38 of 2001 (FICA) obligations for VV Ubuntu Labs LLC as a Category 17 FinTech / payment facilitator.

## Risk Assessment

| Risk Category | Controls | Review Frequency |
|---|---|---|
| Money laundering | CDD on all members | Per onboarding |
| Terrorist financing | Identity verification, sanctions screening | Per onboarding |
| Fraudulent contributions | Threshold limits, anomaly detection | Continuous |
| Insider access | Role-based access, audit logging | Per access change |

## Internal Controls

- Pre-commit secret scanning (`scripts/secret-scan-precommit.js`)
- Audit logging for all admin actions
- TOTP-controlled build/deploy pipeline
- Branch protection on compliance-fabric

## STR Procedure

_See `docs/legal/fica/str-procedure.md` for Suspicious Transaction Reporting._

## Compliance Officer

`[NAME]` appointed as Compliance Officer under FICA. Contact: compliance@vvu.co.za

## Review Cycle

Annual review + ad hoc upon regulatory update or significant segment change.
