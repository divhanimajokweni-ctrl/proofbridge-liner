# Terms of Service

**ProofBridge Liner** — Integrated Verification Environment for Physical AI Systems

**Effective Date:** 18 August 2026

**Provider:** Vaguely Vanity (Pty) Ltd (RF), trading as Venture Vision Ubuntu (VVU)  
**CIPC Registration:** 2026/259053/07  
**Project:** ProofBridge Liner  
**Live URL:** [https://proofbridge.venturevisionubuntu.co.za](https://proofbridge.venturevisionubuntu.co.za)  
**Source Repository:** [https://github.com/divhanimajokweni-ctrl/proofbridge-liner](https://github.com/divhanimajokweni-ctrl/proofbridge-liner)

---

## 1. Acceptance of Terms

By accessing, using, or interacting with ProofBridge Liner (the “Software”), whether through the hosted instance at [https://proofbridge.venturevisionubuntu.co.za](https://proofbridge.venturevisionubuntu.co.za), a self-hosted deployment, or any API endpoints provided by the Software, you agree to be bound by these Terms of Service (“Terms”).

If you do not agree to these Terms, you must not access or use the Software.

These Terms apply to all users, contributors, and API consumers. They operate alongside, and do not supersede, the GNU Affero General Public License v3.0 (AGPL-3.0) under which the Software is distributed.

---

## 2. Open-Source License

ProofBridge Liner is free and open-source software distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. A copy of the full license text is included in the source repository and is available at [https://www.gnu.org/licenses/agpl-3.0.html](https://www.gnu.org/licenses/agpl-3.0.html).

Key implications of the AGPL-3.0 license:

- You may use, study, modify, and redistribute the Software.
- If you modify the Software and serve it over a network (including via a web interface or API), you must make the complete corresponding source code available to all users under the same license.
- There are no warranty guarantees. See Section 4 for full details.
- Any derivative works must also be licensed under AGPL-3.0.

These Terms govern your use of the hosted service and community interactions. The AGPL-3.0 license governs the software itself. In the event of a conflict between these Terms and the AGPL-3.0 license, the AGPL-3.0 license prevails with respect to the software’s distribution and modification rights.

---

## 3. Epistemic Immunity Notice

> **This section is a core architectural invariant of ProofBridge Liner. It is not a discretionary policy.**

ProofBridge Liner is an Integrated Verification Environment (IVE) designed to reason about the correctness, safety, and reliability of physical AI systems through formal and semi-formal proof structures. The integrity of the verification process is a constitutional invariant of the system.

### 3.1 Constitutional Invariant

The system **cannot be compelled, configured, or modified** to accept an invalid proof as valid. Specifically:

- **No override mechanism exists.** There is no configuration flag, API parameter, administrative control, or backdoor that can cause the Software to report a proof as verified when it has not passed the applicable verification criteria.
- **Correctness is non-negotiable.** The verification engine operates on formally defined rules. If a proof does not satisfy those rules, the system will reject it regardless of the identity, authority, or intentions of the submitting party.
- **No party—including the developers, maintainers, hosting provider, or any government—can direct the Software to produce a false verification result.** Any attempt to circumvent this invariant would require modifying the source code in a way that would be publicly auditable under the AGPL-3.0 license.

### 3.2 What This Means for Users

- If the system marks a proof as **Verified**, it has passed all applicable verification checks and can be relied upon within the scope of those checks.
- If the system marks a proof as **Rejected** or **Unverified**, the proof has failed one or more verification checks. This outcome is final and cannot be overridden through the Software’s interface or API.
- Users who believe a rejection is in error should review their proof for logical or structural issues, consult the verification documentation, or raise an issue on the public repository.

### 3.3 Scope

This epistemic immunity applies to all verification operations performed by the Software, including but not limited to: theorem proving, claim verification, evidence assessment, and any automated reasoning tasks. It does not guarantee that the verification rules themselves are free from error—only that the system faithfully applies whatever rules are configured without external interference.

---

## 4. No Warranty

**THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.**

ProofBridge Liner is a **research and verification tool**. Specifically:

- The Software does not guarantee that any verified proof is correct in an absolute mathematical or logical sense. Verification is performed against defined rules and criteria, which themselves may contain limitations, gaps, or errors.
- The Software is not a substitute for professional engineering review, formal certification by accredited bodies, or legal compliance assessment.
- The maintainers do not warrant that the Software will be available, error-free, secure, or perform at any particular speed or reliability level.
- Use of the Software in safety-critical, mission-critical, or regulatory-governed contexts is at your own risk. You are solely responsible for ensuring that the Software’s output meets the standards required by your domain.

These disclaimers are consistent with and reinforced by Section 15 of the AGPL-3.0 license.

---

## 5. Limitation of Liability

To the fullest extent permitted by applicable law:

- **Vaguely Vanity (Pty) Ltd (RF)**, its directors, officers, employees, contractors, and contributors shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of, or inability to use, the Software.
- This includes, but is not limited to, damages for loss of data, revenue, profits, business opportunities, goodwill, or any other intangible losses, even if the maintainers have been advised of the possibility of such damages.
- The total aggregate liability of all parties involved in the development and maintenance of the Software shall not exceed zero Rand (ZAR 0.00).
- This limitation applies regardless of the legal theory under which liability is asserted, whether in contract, tort (including negligence), strict liability, or any other basis.

Some jurisdictions do not allow the exclusion or limitation of certain liabilities. In such jurisdictions, our liability is limited to the maximum extent permitted by law.

---

## 6. User Responsibilities

By using ProofBridge Liner, you agree to:

1. **Use the Software lawfully.** You will not use the Software for any purpose that is unlawful, defamatory, harassing, harmful, or otherwise objectionable.
2. **Provide accurate input.** You are responsible for the accuracy and integrity of any claims, proofs, data, or configurations you submit to the system.
3. **Not attempt to circumvent verification.** You will not attempt to exploit, bypass, or undermine the verification engine’s integrity, including through malformed inputs, resource exhaustion attacks, or social engineering of maintainers.
4. **Not misuse the API or hosted service.** You will not engage in automated scraping at scale, denial-of-service attacks, or any activity that degrades the service for other users.
5. **Accept verification outcomes.** You acknowledge that the system’s verification results are determined by its rules and that rejections cannot be administratively overridden (see Section 3).
6. **Report vulnerabilities responsibly.** If you discover a security vulnerability, you will report it privately through the repository’s security reporting channels before any public disclosure.
7. **Comply with the AGPL-3.0 license.** If you modify or redistribute the Software, you will comply with all obligations of the AGPL-3.0 license, including the network interaction clause.

---

## 7. API Usage and Rate Limits

### 7.1 API Access

ProofBridge Liner provides programmatic access through its API endpoints. API access is subject to the same Terms as the hosted service.

### 7.2 Rate Limits

To ensure fair and reliable access for all users, the following rate limits apply to the hosted instance:

- **Verification requests:** A reasonable rate limit applies, intended to prevent abuse while supporting normal research and development workflows.
- **Webhook delivery:** Retry budgets and circuit-breaker mechanisms are in place to prevent cascade failures. Excessive failed deliveries may result in temporary suspension of webhook endpoints.
- **General API calls:** Rate limits are enforced per IP address and/or API key. Specific limits may be adjusted at the maintainers’ discretion.

### 7.3 Fair Use

You agree not to:

- Automate requests in a manner that exceeds reasonable use or impairs service availability.
- Use the API to build competing services without complying with the AGPL-3.0 license.
- Attempt to probe, scan, or stress-test the service beyond normal usage without prior written consent.

Rate limits and fair-use policies may be updated. Current limits will be documented in the project’s API documentation.

---

## 8. Data and Privacy

### 8.1 Self-Hosted Architecture

ProofBridge Liner is designed to be self-hosted. The hosted instance at [https://proofbridge.venturevisionubuntu.co.za](https://proofbridge.venturevisionubuntu.co.za) is provided as a community service.

### 8.2 No Third-Party Data Collection

- The Software **does not collect, sell, or share personal data with third parties** for advertising, marketing, or any commercial purpose.
- No analytics trackers, advertising pixels, or third-party data harvesting tools are embedded in the Software.
- Data submitted through the verification pipeline (proofs, claims, evidence) is processed for verification purposes only and is not used for any secondary purpose.

### 8.3 Data Retention

- Data submitted to the hosted instance may be retained for operational purposes, including debugging, system improvement, and abuse prevention.
- Users who self-host the Software have full control over their own data retention policies.
- You may request the deletion of your data from the hosted instance by contacting the maintainers (see Section 13).

### 8.4 Protection of Personal Information

The hosted instance and the Software’s design are intended to comply with the spirit of the **Protection of Personal Information Act 4 of 2013 (POPIA)** of the Republic of South Africa. However, given the Software’s nature as a verification tool with minimal personal data collection, formal POPIA compliance measures will be implemented as the service scales.

---

## 9. Intellectual Property

### 9.1 Copyright

The copyright in ProofBridge Liner is held by **Vaguely Vanity (Pty) Ltd (RF)**, trading as Venture Vision Ubuntu (VVU). The Software is made available under the AGPL-3.0 license, which grants you broad rights to use, modify, and redistribute the code.

### 9.2 Trademarks

- **ProofBridge Liner**, **Venture Vision Ubuntu**, and **VVU** are trademarks or trading names of Vaguely Vanity (Pty) Ltd (RF).  
- **Mihle Majokweni** is the founder and primary maintainer of the project.
- You may use these names to refer to the Software in a descriptive manner, but you may not use them to endorse or promote derivative products without prior written permission.

### 9.3 Contributions

Contributions to the project are subject to the AGPL-3.0 license. By submitting a contribution, you affirm that you have the right to license it under AGPL-3.0 and that you grant the project a perpetual, worldwide, non-exclusive, royalty-free license to use, modify, and distribute your contribution.

### 9.4 Third-Party Components

The Software may include or depend on third-party open-source libraries, each governed by its own license. A complete list of dependencies and their licenses is available in the source repository.

---

## 10. Community Conduct

### 10.1 Code of Conduct

All users, contributors, and community members are expected to interact with respect, professionalism, and good faith. Specifically:

- Do not engage in harassment, discrimination, or personal attacks in issues, pull requests, discussions, or any other community channels.
- Do not post spam, malware, or intentionally misleading content.
- Do not attempt to impersonate maintainers, contributors, or other users.
- Constructive criticism and disagreement are welcome; abuse is not.

### 10.2 Enforcement

Maintainers reserve the right to remove content, close issues, and restrict access to community channels for users who violate these conduct standards. Repeated or severe violations may result in a permanent ban from the hosted service’s interactive features.

### 10.3 Open-Source Community

ProofBridge Liner thrives as an open-source project. We welcome contributions, bug reports, and discussions from all individuals regardless of background, identity, or experience level. We are committed to maintaining a welcoming and inclusive community.

---

## 11. Modifications to Terms

These Terms may be updated from time to time. When modifications are made:

- The revised Terms will be posted on the project’s documentation site and/or repository.
- The “Effective Date” at the top of this document will be updated to reflect the date of the most recent revision.
- Material changes that affect user rights or obligations will be communicated through the project’s standard communication channels (e.g., repository notices, website banners).
- Your continued use of the Software after the posting of revised Terms constitutes acceptance of the updated Terms.

We recommend reviewing these Terms periodically to stay informed of any changes.

---

## 12. Governing Law

These Terms are governed by and construed in accordance with the **laws of the Republic of South Africa**, without regard to its conflict-of-law principles.

### 12.1 Jurisdiction

Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts of the **Republic of South Africa**.

### 12.2 Open-Source Dispute Resolution

Given the open-source nature of the Software, we encourage users to attempt to resolve disputes through the following channels before resorting to legal action:

1. **GitHub Issues:** Raise a concern on the [public repository](https://github.com/divhanimajokweni-ctrl/proofbridge-liner/issues).
2. **Direct Contact:** Reach out to the maintainers using the contact information in Section 13.
3. **Community Discussion:** Engage with the community through available discussion channels.

Litigation should be a last resort in the open-source context.

---

## 13. Contact Information

For questions, concerns, or notices related to these Terms, the Software, or the hosted service, please contact:

**Venture Vision Ubuntu (VVU)**  
*A project of Vaguely Vanity (Pty) Ltd (RF)*  

- **Founder:** Mihle Majokweni  
- **CIPC Registration:** 2026/259053/07  
- **Project Repository:** [https://github.com/divhanimajokweni-ctrl/proofbridge-liner](https://github.com/divhanimajokweni-ctrl/proofbridge-liner)  
- **Live Service:** [https://proofbridge.venturevisionubuntu.co.za](https://proofbridge.venturevisionubuntu.co.za)  

For security vulnerability reports, please use the repository’s security reporting features or contact the maintainers directly through available channels.

---

## Acknowledgment

By using ProofBridge Liner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, the AGPL-3.0 license, and the Epistemic Immunity Notice set forth herein.

---

*This document was last updated on 18 August 2026.*