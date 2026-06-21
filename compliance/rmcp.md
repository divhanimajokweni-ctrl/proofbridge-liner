# Risk Management and Compliance Programme (RMCP)

**Entity:** Venture Vision Ubuntu (VVU) / ProofBridge Liner
**Institution Type:** Legal Practitioner / Technology Service Provider (Accountable Institution)
**Legislative Framework:** Financial Intelligence Centre Act, 2001 (Act No. 38 of 2001) ("FIC Act")
**Document Owner:** Compliance Officer, VVU
**Effective Date:** 2026-06-20
**Review Cycle:** Annual (or upon material business/regulatory change)
**Version:** 1.0

---

## 1. RMCP Governance

### 1.1 Purpose and Scope

This Risk Management and Compliance Programme (RMCP) is established in compliance with Section 42 of the Financial Intelligence Centre Act, 2001 (FIC Act). It applies to Venture Vision Ubuntu (VVU), operating the ProofBridge Liner platform, as an accountable institution providing legal practitioner services and technology infrastructure for property transaction verification, circuit breaker safety kernels, and compliance-related digital services.

### 1.2 Governing Body and Accountability

- **Board / Designated Authority:** Ultimate accountability for ML/TF/PF risk management rests with the Board of VVU.
- **Compliance Officer (CO):** Appointed individual responsible for:
  - Developing, maintaining, and implementing this RMCP;
  - Monitoring ongoing compliance with FIC Act obligations;
  - Reporting to the Board on compliance matters;
  - Liaising with the Financial Intelligence Centre (FIC) as required;
  - Training and awareness programmes for employees.
- **ML/TF/PF Risk Committee:** Cross-functional committee (legal, technical, finance) convened quarterly to review risk assessments, monitor emerging threats, and escalate material risks to the Board.

### 1.3 Policy Framework

The RMCP is supported by the following subsidiary policy documents:
1. Customer Due Diligence (CDD) Policy
2. Record-Keeping Policy and Procedures
3. Suspicious and Unusual Transaction Reporting (SUTR) Policy
4. Sanctions Screening and Targeted Financial Sanctions (TFS) Policy
5. PEP Identification and Enhanced Due Diligence (EDD) Policy
6. Risk Assessment Methodology and Scoring Matrix
7. Employee Training and Awareness Policy
8. Technology and Systems Controls Policy
9. Responsive and Remedial Action Policy (SAR/SUR filing templates)

### 1.4 Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| Compliance Officer | Design, maintenance, and oversight of RMCP; SAR filing; FIC liaison |
| Legal Practitioners | Execute CDD; monitor client activity; escalate suspicious indicators |
| Technical / Engineering | Maintain audit logs; implement monitoring controls; report system anomalies |
| Finance / Billing | Monitor fee structures; flag extraordinary or atypical payment patterns |
| All Employees | Complete mandatory AML/CFT training; report suspicious activity internally |

### 1.5 Review and Updating

- Comprehensive review: Annually or within 30 days of any material regulatory change.
- Partial review: Upon introduction of new products, services, or delivery channels.
- Board sign-off required for all material amendments to the RMCP.

---

## 2. Money Laundering, Terrorist Financing and Proliferation Financing Risk Assessment and Risk-Rating Framework

### 2.1 Entity-Wide (Business-Level) Risk Assessment

#### 2.1.1 Inherent Risk Context

VVU operates at the intersection of legal services, digital transaction infrastructure, and property verification. The following operational factors shape the entity-wide risk profile:

| Risk Factor | Description | Risk Rating |
|-------------|-------------|-------------|
| **Nature of Business** | Legal practitioner services (property conveyancing, compliance document generation, smart contract auditing) with integrated CircuitBreaker.sol safety kernel on Polygon Amoy | Medium-High |
| **Products / Services** | ProofBridge Liner (verification platform), conveyancing support, compliance tokenization, TEE attestation, webhook/event infrastructure | Medium-High |
| **Client Base** | Property buyers/sellers, legal practitioners, financial intermediaries, regulatory technology partners | Medium |
| **Geographic Location** | South Africa (ZA) primary; digital platform accessible globally | Medium |
| **Delivery Channels** | Online (web platform, REST API, goAML filing), email (Resend), blockchain transactions (Polygon Amoy) | Medium |
| **High-Risk Indicator Exposure** | PEP involvement in property transactions; complex ownership structures; cross-border fund flows | Medium |

#### 2.1.2 ML/TF/PF Risk Drivers

Specific risks identified for VVU:
1. **Conveyancing Risk:** Property transactions are a classic ML/TF vehicle (layering through complex ownership, rapid turnover).
2. **Complex Legal Structures:** Clients may use shell entities, trusts, or multi-jurisdictional structures to obscure beneficial ownership.
3. **TFS/ProW Financing Risk:** Property can be used as an asset class for PF (sanctioned entities acquiring immovable property).
4. **Digital / Crypto-Asset Interface:** VVU's integration with on-chain contracts and tokenization introduces novel laundering vectors (mixers, privacy coins, rapid token-to-fiat swaps).
5. **Jurisdictional Risk:** Clients operating in high-risk jurisdictions (FATF grey list, non-cooperative jurisdictions) may seek to use VVU services for layering.
6. **Electronic Fund Flow Risk:** Unusual fee structures (extraordinary fees for nominal services; non-associated third-party payments; cash fee payments).

#### 2.1.3 Residual Risk Rating

After implementing the controls described in this RMCP, the residual risk rating is assessed as **Medium**, subject to ongoing monitoring and annual recalibration.

### 2.2 Product and Services Risk Assessment

Each product/service is assessed for ML/TF/PF risk weightings upon introduction and reviewed upon material change.

| Product / Service | Risk Weighting | Rationale | Review Date |
|-------------------|---------------|-----------|-------------|
| **ProofBridge Liner — Verification Platform** | High | Enables high-value property transaction verification; susceptible to manipulation by sophisticated actors | Annual |
| **Conveyancing Support Services** | Medium-High | Direct handling of property fund flows; title deed transfers | Annual |
| **Compliance Tokenization (ERC-721/1155)** | Medium | On-chain asset representation; potential for rapid cross-border movement | Annual |
| **TEE Attestation Services** | Low-Medium | Technical integrity service; limited direct financial exposure | Annual |
| **Webhook / Event Infrastructure** | Low | Technical integration layer; low direct ML/TF/PF exposure | Annual |
| **CircultBreaker.sol Safety Kernel** | Medium-High | Smart contract control layer; potential for abuse in high-value protocol settings | Annual |
| **Email / Communications** | Low | Communication channel; monitored for phishing/social engineering induced fraud | Annual |

**Product Launch Protocol:**
No new product or service shall be offered to clients without:
1. A documented ML/TF/PF risk weighting assessment;
2. Identification of required CDD controls;
3. Integration with monitoring and reporting controls described in Sections 6 and 7;
4. Mandatory training for relevant employees.

### 2.3 Client-Level Risk Assessment

#### 2.3.1 Risk Categorization

All clients are classified into one of three risk categories prior to establishing a business relationship or executing a single transaction:

| Risk Category | Description | CDD Level |
|---------------|-------------|-----------|
| **Low Risk** | Established individuals or entities with verifiable low-risk profiles; no PEP, sanctions, or high-risk geographic links | Simplified Due Diligence (SDD) |
| **Normal Risk** | Standard clients with no adverse indicators; routine transaction profiles | Normal Due Diligence (NDD) |
| **High Risk** | PEPs (foreign or domestic); clients from high-risk jurisdictions; complex ownership structures; extraordinary fee proposals; cash payments; third-party funding without commercial rationale | Enhanced Due Diligence (EDD) |

#### 2.3.2 Risk Factors (per Guidance Note 7)

Client risk is assessed against the following factors:

1. **Client Type:** Individual, trust, company, partnership, close corporation, cooperative, government entity, PEP.
2. **Delivery Channel:** Face-to-face, online-only, through a financial intermediary, through an agent.
3. **Geographic Location:** South Africa (low-medium); FATF identified high-risk jurisdictions; sanctioned jurisdictions; countries with deficient AML/CFT regimes.
4. **Products and Services:** Property, conveyancing, tokenization, legal opinion, advisory.
5. **Business Relationship Duration / History:** New clients pose inherently higher risk until verified.

#### 2.3.3 Risk Scoring Matrix (aligned with PCC 53)

| Risk Factor | Low (1) | Normal (2) | High (3) |
|-------------|---------|-----------|----------|
| Client type (individual, trust, company) | Verified SA individual | SA company with audited accounts | Trust/offshore structure; PEP |
| Geographic location | SA (non-sanctioned province) | Other FATF compliant jurisdiction | FATF grey/black list; sanctioned |
| Delivery channel | Face-to-face verified | Hybrid (online + video) | Online-only; no physical verification |
| Products/services | Routine advisory | Property conveyancing | Tokenization; complex cross-border |
| Ownership transparency | Single natural person with verifiable ID | Listed company with public records | Multi-layer structure; nominee directors |
| Fee structure | Standard market fees | Slight deviation | Extraordinary fees; cash; non-associated third party |

**Risk Score Thresholds:**
- Low Risk: 6–8 points → SDD
- Normal Risk: 9–13 points → NDD
- High Risk: 14–18 points → EDD

#### 2.3.4 Client-Level Risk Assessment Procedure

1. **Identify:** Upon initial client onboarding, collect information for all four risk factors.
2. **Assess:** Apply the scoring matrix; assign risk category.
3. **Document:** Record risk assessment outcome, rationale, and CDD level in client file.
4. **Implement:** Apply CDD controls commensurate with risk category (see Section 4).
5. **Review:** Re-assess risk at least annually or upon any material change (change of beneficial ownership, new transaction type, jurisdiction change, etc.).

---

## 3. Customer Due Diligence Controls

### 3.1 Overview

Customer Due Diligence (CDD) is the cornerstone of the risk-based approach. VVU will verify the identity of clients and understand the nature of their business before establishing a business relationship or executing a single transaction.

### 3.2 Simplified Due Diligence (SDD) — Low Risk

Applicable to: Verified SA individuals with standard transaction profiles.

- **Identification:** Full name, ID number, date of birth, residential address.
- **Verification:** SA ID document (green barcoded or smart ID) and proof of residence (utility bill, municipal statement, not older than 3 months).
- **Beneficial Ownership:** Not required for sole individuals unless transaction complexity warrants.
- **Ongoing Monitoring:** Periodic review at triennial intervals.

### 3.3 Normal Due Diligence (NDD) — Normal Risk

Applicable to: SA companies, close corporations, partnerships, trusts (verified trustees identified).

- **Identification:** Full name, ID, date of birth, address for all natural persons involved.
- **Verification:** SA ID documents; proof of residence for individuals; entity registration documents (CK1/CIPRO certificates); trust deeds; partnership agreements.
- **Beneficial Ownership:** Identify natural persons who ultimately own or control ≥25% of the client entity or who exercise control through other means.
- **Purpose and Nature of Business:** Document intended nature of the business relationship and expected transaction patterns.
- **Source of Funds:** Obtain and verify source of funds for initial transaction.
- **Source of Wealth:** For clients with significant transaction volumes (>R1m), obtain and verify source of wealth.
- **Ongoing Monitoring:** Annual review; transaction monitoring per Section 6.

### 3.4 Enhanced Due Diligence (EDD) — High Risk

Applicable to: PEPs (foreign and domestic), high-risk jurisdiction clients, complex structures, extraordinary fee proposals.

All NDD requirements apply, **plus**:

1. **Senior Management Approval:** Written approval from Board or designated senior officer before establishing business relationship.
2. **Establish Source of Wealth and Source of Funds:** Comprehensive documentation for all high-risk clients.
3. **Enhanced Ongoing Monitoring:** Transaction monitoring ongoing, with heightened scrutiny of payment patterns, frequency, and amounts.
4. **PEP-Specific Controls (see Section 5):** Additional verification of PEP status; political exposure database checks.
5. **Complex Structure Analysis:** Independent verification of beneficial ownership through corporate registry searches, independent confirmation, or third-party reports.
6. **Third-Party Payment Review:** If fees are to be paid by a non-associated third party, document: identity of payer; relationship between client and payer; commercial rationale; verify payer's identity per applicable CDD standard.
7. **Frequent Review:** Bi-annual risk re-assessment; immediate re-assessment upon any change in client circumstances.

### 3.5 Ongoing Due Diligence

- **Continuous Monitoring:** Apply ongoing monitoring controls per Section 6 throughout the business relationship.
- **Periodic Re-verification:** Verify client identity and beneficial ownership every 3 years (NDD) or annually (EDD/ PEPs).
- **Trigger Events for Re-assessment:**
  - Change in client activity (sudden large transactions, unusual complexity);
  - Change in jurisdiction or beneficial ownership;
  - Negative media or adverse regulatory findings;
  - Transaction refused or previously reported.

---

## 4. Targeted Financial Sanctions Controls

### 4.1 Policy Statement

VVU prohibits providing services to any person or entity listed on:
- United Nations Security Council Resolutions (UNSCR) consolidated lists;
- South African Financial Action Task Force (FATF) targeted financial sanctions lists;
- Any sanctions list published by the Office of Foreign Assets Control (OFAC), European Union, or other applicable competent authority.

### 4.2 Screening Controls

1. **Pre-Onboarding Screening:** All prospective clients are screened against all relevant sanctions lists prior to onboarding.
2. **Ongoing Screening:** All active clients are screened:
   - Daily against updated consolidated sanctions lists;
   - At every transaction initiation for PEP/SOE (state-owned entity) linkages;
   - Upon receipt of any FIC or law enforcement notification.
3. **Screening Tools:** VVU will utilise:
   - FIC-published consolidated lists (available on FIC website);
   - Commercial sanctions screening service (where available and proportionate);
   - Manual verification for high-risk clients using open-source intelligence and corporate registries.

### 4.3 Blocking and Reporting

- **Immediate Block:** Services shall not be provided to, and transactions involving, any listed person or entity shall be blocked immediately upon identification.
- **Immediate Reporting:** Identification of a match (or potential match) on a sanctions list shall be reported to the FIC and relevant law enforcement without delay.
- **Documentation:** All screening results (pass, match, escalation) shall be retained in the client file.

---

## 5. Controls Related to Politically Exposed Persons

### 5.1 Identification

- **Domestic PEPs:** All clients are assessed for domestic PEP status (South African government officials, senior political party officials, senior military officers, senior SOE executives, judges).
- **Foreign PEPs:** All clients are assessed for foreign PEP status (foreign government officials, heads of state, senior political party figures, international organisation officials).
- **Family Members and Close Associates (FMCAs):** PEP identification extends to family members and known close associates of PEPs.

### 5.2 PEP Controls

All PEP-related engagements require EDD, in addition to:

1. **Source of Wealth Verification:** Obtain and verify documentary evidence of source of wealth prior to onboarding.
2. **Source of Funds:** For each transaction, obtain and verify source of funds for PEP clients.
3. **Nature and Purpose of Business Relationship:** Obtain detailed written explanation of the purpose of the relationship and expected transaction patterns.
4. **Senior Management Approval:** Written approval from Board or designated committee before accepting PEP as client.
5. **Increased Transaction Monitoring:** Flag PEP accounts for enhanced ongoing monitoring (Section 6).
6. **Periodic Review:** Re-assess PEP status and risk profile at least annually.

### 5.3 PEP Database Resources

- South African PEP registers (Parliamentary Monitoring Group, SOE annual reports, government gazettes);
- Open-source intelligence (news, LinkedIn, public records);
- Commercial PEP databases (where proportionate to risk);
- Client self-declaration forms for PEP status (mandatory for all new clients at NDD level and above).

---

## 6. Account Monitoring

### 6.1 Monitoring Objectives

VVU will continuously monitor all active business relationships and single transactions for suspected ML/TF/PF activity through automated and manual controls.

### 6.2 Automated Monitoring

- **Transaction Monitoring System:** All payment flows through VVU's billing infrastructure shall be logged and subject to automated rule-based monitoring.
- **Monitored Events:**
  - Payments of extraordinary fees for services not warranting such fees;
  - Payments from non-associated or unknown third parties;
  - Cash payments exceeding R50,000 (or applicable threshold);
  - Rapid succession of transactions inconsistent with client profile;
  - Transactions involving sanctioned jurisdictions or high-risk counterparties;
  - Multiple bank accounts or foreign accounts without commercial rationale;
  - Sudden change in transaction patterns, instructions, or counterparties;
  - Circuit breaker / smart contract interactions inconsistent with client profile.

### 6.3 Manual Review

- **Client Activity Review:** Legal practitioners shall review client files periodically (minimum: quarterly for normal risk; monthly for high risk) for:
  - Unexplained complexity in legal instructions;
  - Requests to facilitate rapid property or fund transfers;
  - Introduction of new beneficial owners or structures without prior disclosure;
  - Reluctance to provide identification or documentation;
  - Cross-border transaction activity inconsistent with stated business purpose.

### 6.4 Alert Escalation Protocol

1. **Alert Raised:** Automated system or legal practitioner flags activity.
2. **Initial Review:** Compliance Officer or designated compliance staff reviews within 48 hours.
3. **Investigation:** Gather additional information; consult legal practitioner; review transaction history.
4. **Internal SAR Decision:** Determine whether activity meets the threshold for a suspicious and unusual transaction report to the FIC.
5. **External Reporting:** File SAR/SUR to FIC via goAML within 15 days of suspicion arising.
6. **Documentation:** Retain complete record of investigation, decision-making, and reporting.

---

## 7. Reporting Controls

### 7.1 Suspicious and Unusual Transaction Reports (SUTR)

VVU is legally obligated to report to the FIC any transaction or activity that is or appears to be suspicious and unusual, regardless of monetary value.

**Reporting Standards:**

- **Threshold:** No monetary threshold applies. Any suspected ML/TF/PF activity must be reported.
- **Timeframe:** Report filed without delay, and no later than **15 days** after suspicion arises.
- **Platform:** goAML — FIC's online registration and reporting platform.
- **Proof Requirement:** The filer does not need to prove that funds or activity are linked to a crime. Subjective suspicion is sufficient.

**Suspicion Triggers (non-exhaustive):**
- Anonymity of clients;
- Complex transactions for which legal advice is provided without apparent commercial logic;
- High-risk clients or jurisdictions (sanctions lists, PEPs);
- Complex legal structures designed to avoid detection of ownership, source, or control;
- Extraordinary fee offers inconsistent with scope of services;
- Payments from non-associated or unknown third parties;
- Cash payments for legal services;
- Requests for rapid fund/property transfers;
- Clients changing transaction instructions suddenly or without rationale;
- Involvement of foreign PEPs or domestic PEPs where beneficial ownership is obscured.

**Reporting Procedure:**

1. **Internal Notification:** Legal practitioner or technical staff notifies Compliance Officer immediately upon forming suspicion.
2. **Assessment:** Compliance assesses within 2 business days whether to file SAR/SUR.
3. **Draft:** Complete goAML report (SAR/SUR) with full particulars: parties, transaction details, grounds for suspicion, timeline.
4. **Submission:** Submit via goAML within 15-day deadline.
5. **Post-Submission Protocol:**
   - Do **not** inform the client or any associated person that a report has been made or is being considered.
   - Do **not** cease providing services solely on the basis of filing a report (unless instructed otherwise by court or law enforcement).
   - Preserve all records.

### 7.2 Cash Transaction Reports (CTR)

Cash transactions exceeding R24,999.99 (or as amended) shall be reported via goAML.

### 7.3 Cross-Border Foreign Currency Reports

Cross-border wire transfers above applicable thresholds shall be reported in accordance with FIC requirements.

### 7.4 FIC Correspondence

The Compliance Officer is the designated point of contact for all FIC communications.

---

## 8. Record-Keeping Controls

### 8.1 Retention Period

All records required under the FIC Act shall be retained for a minimum of **five (5) years** from the date of the transaction or termination of the business relationship, whichever is later, or as otherwise required by law (including the Legal Practice Act, 2014 and applicable provincial law society rules).

### 8.2 Mandatory Records

| Record Category | Specifics | Retention Location |
|-----------------|-----------|-------------------|
| **Client Identification Records** | ID documents, proof of residence, corporate registration documents | Secure encrypted server (Supabase-backed) |
| **Risk Assessment Records** | Client-level risk assessments, risk scoring matrices, business-level risk assessments | Secure encrypted server |
| **Transaction Records** | Payment receipts, bank statements, wire transfer instructions, invoices, fee agreements | Secure encrypted server |
| **Correspondence Records** | All client communications, legal advice records, emails, meeting minutes | Secure encrypted server |
| **EDD Records** | PEP verification, source of wealth/funds documentation, senior management approvals | Secure encrypted server |
| **Monitoring and Investigation Records** | Internal alerts, investigation reports, AML/CFT compliance meeting minutes | Secure encrypted server |
| **SAR/SUR/CTR Records** | Copies of all FIC reports filed, submission confirmations from goAML | Secure encrypted server |
| **Training Records** | Attendance registers, training materials, completion certificates, competency assessments | Secure encrypted server |
| **Policy Documents** | This RMCP and all subsidiary policies, with version history and amendment logs | Secure encrypted server |
| **Sanctions Screening Records** | Screening results, negative news scans, escalation notes | Secure encrypted server |

### 8.3 Electronic Records Protocol

- All electronic records shall be backed up daily and stored with access controls.
- Audit trails shall be maintained for all access to client and compliance records.
- Records shall be retrievable within 24 hours upon FIC or law enforcement request.

### 8.4 Destruction of Records

Records shall not be destroyed before the expiry of the retention period. Destruction shall be by secure means (digital: cryptographic wipe; physical: cross-cut shredding).

---

## 9. Risk Indicators for Legal Practitioners

The following indicators shall be used by legal practitioners and monitoring systems to identify potential ML/TF/PF:

1. Clients whose identity cannot be readily established or verified;
2. Complex transactions with no apparent commercial or legal rationale;
3. Clients linked to institutions or jurisdictions on targeted financial sanctions lists;
4. Complex legal structures (trusts, multi-layer entities, nominee directors) designed to obscure beneficial ownership (see PCC 59);
5. Clients offering extraordinary fees inconsistent with scope of services;
6. Payments from non-associated or unknown third parties or cash fee payments;
7. Physical handling of funds through accounts controlled by the legal practitioner without clear professional justification;
8. Requests for rapid in-and-out fund transfers or property transfers with unusually short timeframes;
9. Multiple bank accounts or foreign accounts used without good reason;
10. Involvement of foreign PEPs or domestic PEPs where beneficial ownership is obscured (see PCC 51);
11. Sudden changes in transaction instructions, counterparties, or structure with no apparent commercial logic.

Educate all legal practitioners to consult:
- FIC Sector Risk Assessment for Legal Practitioners
- PCC 47A (Guidance on Interpretation of Legal Practitioners under FIC Act)
- PCC 51 (Domestic PEPs)
- PCC 53 (Client Risk Assessment Matrix)
- PCC 59 (Beneficial Ownership and Complex Structures)
- Guidance Note 4B (Suspicious and Unusual Transaction Reporting)

---

## 10. Training and Awareness

### 10.1 Mandatory Training

All employees and legal practitioners shall complete initial ML/CFT training within 30 days of engagement and refresher training annually.

Training shall cover:
- FIC Act obligations for accountable institutions and legal practitioners;
- ML/TF/PF risk indicators specific to the legal sector;
- Application of the risk-based approach;
- CDD procedures and documentation requirements;
- Sanctions, PEP, and TFS obligations;
- SAR/SUR filing procedures and timelines;
- goAML platform usage;
- Client privilege restrictions and disclosure prohibitions (no tipping-off).

### 10.2 Records of Training

The Compliance Officer shall maintain a register of all training activities, including:
- Training date and content;
- Attendee names and roles;
- Assessment/completion records;
- Uptake and comprehension metrics.

---

## 11. Independent Review

An independent review of this RMCP shall be conducted by an external party (qualified AML/CFT auditor or law society compliance consultant) at least once every three (3) years, or as required by the FIC or relevant professional body.

---

## 12. Appendices

### Appendix A: FIC Act Section 42 Requirements Checklist

| Requirement | Section of RMCP |
|-------------|-----------------|
| Policy documents | Section 1.3, Section 9, Appendix A |
| Processes | Sections 3, 4, 5, 6, 7, 8 |
| Systems and controls for CDD | Section 3 |
| Record-keeping | Section 8 |
| Reporting | Section 7 |
| Risk-based approach | Section 2 |
| Training of employees | Section 10 |

### Appendix B: goAML Access Protocol

- Compliance Officer maintains primary goAML credentials.
- Deputy CO designated with secondary credentials.
- Credentials stored in Vercel Production environment variables (encrypted at rest).
- All submissions logged with timestamp and filer details.

### Appendix C: Contact Details

| Authority | Contact |
|-----------|---------|
| FIC Compliance Contact Centre | +27 12 641 6000 |
| FIC Online Compliance Query | Via FIC website (compliance queries portal) |
| VVU Compliance Officer | [compliance@venturevisionubuntu.co.za] |

---

*This RMCP is a living document. It shall be reviewed, updated, and Board-approved annually or upon any material change to the business, regulatory environment, or risk profile.*

**Document approved by:** _________________________
**Name:** Compliance Officer, VVU
**Date:** 2026-06-20

**Document approved by:** _________________________
**Name:** [Board Chair / Designated Authority]
**Date:** _______________

---
