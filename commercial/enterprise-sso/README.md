# Enterprise SSO

**License:** Commercial (Enterprise)
**Tier:** Commercial — Single Sign-On Integration

## Purpose

Enterprise SSO provides corporate identity provider integration through:

- **SAML 2.0** — Security Assertion Markup Language for enterprise federation
- **OIDC** — OpenID Connect for modern identity provider integration

### Capabilities (Planned)

- SAML 2.0 identity provider integration (Azure AD, Okta, OneLogin, etc.)
- OIDC provider integration (Google, Azure AD, Auth0, etc.)
- Identity federation bridging (SAML → OIDC, OIDC → SAML)
- Group/role mapping to Epistemic Runtime capability sets
- Just-in-time provisioning with observation audit trail
- Session management with TEE-attested tokens

### Note on Open-Source Signers

The internal `src/signer/aws-kms.ts` provides `AWSKMSSigner`,
`IAMFederationSigner`, and `OIDCSigner` as signer implementations for the
AIR Kernel. These are functional but not packaged as a standalone SSO module.
The Enterprise SSO module will provide the full identity federation experience
with UI, session management, and compliance audit trails.

### Status

**NOT IMPLEMENTED** — This module requires a valid enterprise license to activate.
Contact `sales@vvu-earth.tech` for enterprise licensing.

### Relationship to Other Modules

- Depends on: `air-kernel` (for ObservationAuth types and capability sets)
- Depends on: `shared/license` (for enterprise license validation)
- Complements: `tee-attestation` (TEE-attested session tokens)
- Complements: `compliance-automation` (identity audit trail evidence)
