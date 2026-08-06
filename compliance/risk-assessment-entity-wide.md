# Entity-Wide ML/TF/PF Risk Assessment
**Appendix to RMCP v1.0**
**Entity:** Venture Vision Ubuntu (VVU) / ProofBridge Liner
**Assessment Date:** 2026-06-20
**Assessment Owner:** Compliance Officer, VVU
**Review Cycle:** Annual

---

## 1. Purpose

This document fulfils the requirement of the FIC Act and associated guidance for an entity-wide (business-level) anti-money laundering, counter-terrorist financing, and counter-proliferation financing risk assessment. This assessment must be conducted prior to drafting the RMCP and updated annually or upon material business change.

---

## 2. Entity Profile

### 2.1 Entity Description

Venture Vision Ubuntu (VVU) operates the ProofBridge Liner platform, providing:
- Property transaction verification services (ProofBridge Liner)
- Legal practitioner support services (conveyancing, compliance documentation)
- Compliance tokenization infrastructure (ERC-721/1155 on Polygon Amoy)
- CircuitBreaker.sol safety kernel (smart contract risk governance)
- TEE attestation services (software-simulated; hardware integration planned)
- Webhook/event infrastructure for payment and compliance notifications
- Email communications via Resend (Domain: venturevisionubuntu.co.za)

### 2.2 Jurisdictional Footprint

- **Primary Location:** South Africa
- **Client Jurisdictions:** Primarily South Africa; digital platform accessible globally
- **Delivery Mechanism:** Online-first with hybrid verification options

---

## 3. Inherent Risk Identification

### 3.1 Risk Factor Analysis

**1. Nature of Business**
- VVU operates at the intersection of legal services, digital transaction infrastructure, and property verification.
- Conveyancing services are inherently susceptible to ML/TF abuse due to high-value fund flows and ownership transfer mechanisms.
- Blockchain integration (CircuitBreaker.sol, tokenization) introduces novel risk vectors not fully matured in regulatory guidance.

**Risk: HIGH**

**2. Products and Services Offered**

| Product/Service | ML/TF/PF Risk Rating | Risk Driver |
|-----------------|---------------------|-------------|
| ProofBridge Liner — Property Verification | HIGH | High-value property transactions; title deed manipulation risk |
| Conveyancing and Legal Support | MEDIUM-HIGH | Direct handling of funds; rapid ownership transfers |
| Compliance Tokenization (ERC-721/1155) | MEDIUM | On-chain asset transfer; potential for rapid cross-border movement and layering |
| CircuitBreaker.sol Safety Kernel | MEDIUM-HIGH | Smart contract control layer; potential for abuse in high-value protocol settings |
| TEE Attestation Services | LOW-MEDIUM | Technical integrity layer; limited direct financial exposure |
| Webhook / Event Infrastructure | LOW | Integration layer; logs payment events; low direct ML exposure |
| Email Communications | LOW | Communication channel; social engineering/impersonation risk |

**3. Client Base**
- Client types include: individual property buyers/sellers, legal practitioners, financial intermediaries, regulatory technology partners.
- Risk is elevated where clients act as intermediaries or introduce opaque corporate structures.

**Risk: MEDIUM-HIGH**

**4. Geographic Location**

| Jurisdiction | Risk Level | Rationale |
|-------------|-----------|-----------|
| South Africa | MEDIUM | FATF member; regulatory framework in place; property sector identified as high-risk in FIC Sector Risk Assessment for Legal Practitioners |
| FATF Grey / Black List Jurisdictions | HIGH | Elevated ML/TF/PF risk; avoid servicing unless controls implemented |
| Other FATF Compliant | LOW-MEDIUM | Established AML/CFT regimes but still subject to CDD |

**Risk: MEDIUM**

**5. Delivery Channels**

| Channel | Risk Level | Controls |
|---------|-----------|---------|
| Face-to-Face | LOW | Highest identification assurance; verified by legal practitioner |
| Video Conference (hybrid) | LOW-MEDIUM | ID document in hand verification; live video session recorded |
| Online-Only | MEDIUM-HIGH | No physical verification; requires documentary evidence plus secondary verification |
| Through Intermediary (trust account) | HIGH | Additional verification required of intermediary; commercial rationale documented |

**Risk: MEDIUM**

**6. Cash and Electronic Fund Flow**

- **Cash:** Accepting cash for legal services presents elevated ML risk. VVU policy shall limit cash acceptance and trigger enhanced monitoring.
- **Electronic Transfer:** Primary payment channel; all transfers monitored through automated controls.
- **Third-Party Payments:** Payments from non-associated parties shall require EDD and commercial rationale documentation.

**Risk: MEDIUM-HIGH**

**7. Technology and Cybersecurity**

- Software-simulated TEE (planned hardware upgrade to SGX/SEV-SNP in Phase 5) constitutes a medium residual risk.
- Blockchain interactions are logged on-chain (Polygon Amoy) providing immutable audit trail.
- Audit log retention and integrity controls are essential.

**Risk: MEDIUM**

---

## 4. Inherent Risk Summary

| Risk Factor | Inherent Risk Rating |
|-------------|-------------------|
| Nature of Business | HIGH |
| Products / Services | MEDIUM-HIGH |
| Client Base | MEDIUM-HIGH |
| Geographic Location | MEDIUM |
| Delivery Channels | MEDIUM |
| Cash / Fund Flow | MEDIUM-HIGH |
| Technology | MEDIUM |

**Overall Inherent Risk Rating: MEDIUM-HIGH**

---

## 5. Control Assessment and Residual Risk

### 5.1 Control Framework

The RMCP v1.0 implements the following controls to mitigate inherent risks:

| Control | Description | Applicable Risk |
|---------|-------------|----------------|
| Risk-Based CDD | SDD/NDD/EDD applied per client risk category | Business, Products, Client Base |
| Sanctions Screening | Daily automated screening against all relevant sanctions lists | Business, Client Base, Geolocation |
| PEP Controls | EDD, senior management approval, source of wealth verification | Client Base, Fund Flow |
| Transaction Monitoring | Automated rule-based system with manual review | Fund Flow, Products |
| SAR/SUR Filing | FIC reporting via goAML within 15 days | All |
| Employee Training | Mandatory annual AML/CFT training for all personnel | All |
| Record-Keeping | 5-year retention in encrypted secure storage | All |
| TEE Attestation | SHA-256 measurement and ephemeral RSA key fingerprint on `/api/verify` | Technology, Products |
| On-Chain Audit Trail | CircuitBreaker.sol events on Polygon Amoy | Products, Technology |
| Board/Committee Oversight | ML/TF/PF Risk Committee; quarterly Board reporting | Governance |

### 5.2 Residual Risk Assessment

| Risk Factor | Inherent Risk | Controls Applied | Residual Risk |
|-------------|--------------|------------------|--------------|
| Nature of Business | HIGH | RMCP + CDD + Monitoring + SAR | MEDIUM-HIGH |
| Products / Services | MEDIUM-HIGH | Product-level DTTRA + CDD + ongoing monitoring | MEDIUM |
| Client Base | MEDIUM-HIGH | SDD/EDD matrix; sanctions + PEP screening | MEDIUM |
| Geographic Location | MEDIUM | Sanctions screening + jurisdiction risk review | LOW-MEDIUM |
| Delivery Channels | MEDIUM | Channel-specific CDD; online verification protocols | MEDIUM |
| Cash / Fund Flow | MEDIUM-HIGH | Monitoring rules; EDD for third-party payments | MEDIUM |
| Technology | MEDIUM | TEE attestation; on-chain logging; access controls | LOW-MEDIUM |

**Overall Residual Risk Rating: MEDIUM**

---

## 6. Emerging and Forward-Looking Risks

1. **Crypto-Asset Regulatory Changes:** South African FSCA crypto-asset regulatory framework is evolving. Increased classification of tokenization services may elevate risk rating.
2. **Proliferation Financing (PF):** As South Africa implements UNSCR obligations more comprehensively, PF screening requirements may expand.
3. **AI and Machine Learning Abuse:** Generative AI could be used to create fraudulent identity documents or manipulate legal instructions; monitor and update verification protocols.
4. **Supply Chain Compromise:** Third-party providers (Resend, Supabase, Polygon RPC) present operational risk; vendor due diligence required.

---

## 7. Approval

This Entity-Wide Risk Assessment is approved by:

_________________________  
Compliance Officer, VVU  
Date: 2026-06-20

_________________________  
Board Chair / Designated Authority  
Date: _______________

---
