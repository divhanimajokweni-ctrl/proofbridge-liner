import { NextResponse } from 'next/server';
import type {
  AttestationCertificate,
  EnvironmentApproval,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// GET /api/trust-roots
// Returns trust root data: attestation certificates, trust log events, trust score
// ---------------------------------------------------------------------------

export async function GET() {
  // Mock 3 attestation certificates
  const certificates: AttestationCertificate[] = [
    {
      id: 'cert-001',
      environmentId: 'env-001',
      certificateType: 'ed25519',
      issuer: 'VVU Root CA',
      subject: 'verify-authenticity@vvu',
      issuedAt: '2025-01-15T08:00:00Z',
      expiresAt: '2026-01-15T08:00:00Z',
      serialNumber: 'SN-ED25519-0001',
    },
    {
      id: 'cert-002',
      environmentId: 'env-001',
      certificateType: 'x509',
      issuer: 'VVU Intermediate CA',
      subject: 'detect-water-loss@vvu',
      issuedAt: '2025-02-01T10:30:00Z',
      expiresAt: '2025-08-01T10:30:00Z',
      serialNumber: 'SN-X509-0002',
    },
    {
      id: 'cert-003',
      environmentId: 'env-002',
      certificateType: 'hsm',
      issuer: 'VVU Root CA',
      subject: 'manage-community-pools@vvu',
      issuedAt: '2024-11-20T14:00:00Z',
      expiresAt: '2025-11-20T14:00:00Z',
      revokedAt: '2025-03-10T09:15:00Z',
      serialNumber: 'SN-HSM-0003',
    },
  ];

  // Mock 2 environment approvals
  const approvals: EnvironmentApproval[] = [
    {
      id: 'approval-001',
      environmentId: 'env-001',
      approvedBy: 'chief-security-officer@vvu',
      approvedAt: '2025-01-14T16:00:00Z',
      conditions: ['Production deployment only', 'Audit trail required'],
    },
    {
      id: 'approval-002',
      environmentId: 'env-002',
      approvedBy: 'compliance-officer@vvu',
      approvedAt: '2024-11-19T12:00:00Z',
      conditions: ['Financial verification required before use'],
    },
  ];

  // Mock 5 trust log events
  const trustLogEvents = [
    {
      id: 'tle-001',
      eventType: 'certificate_issued',
      subject: 'verify-authenticity@vvu',
      actor: 'VVU Root CA',
      certificateId: 'cert-001',
      details: {
        certificateType: 'ed25519',
        environmentId: 'env-001',
        reason: 'Initial certificate issuance for verification capability',
      },
      timestamp: '2025-01-15T08:00:00Z',
    },
    {
      id: 'tle-002',
      eventType: 'certificate_issued',
      subject: 'detect-water-loss@vvu',
      actor: 'VVU Intermediate CA',
      certificateId: 'cert-002',
      details: {
        certificateType: 'x509',
        environmentId: 'env-001',
        reason: 'HBK inference capability certificate',
      },
      timestamp: '2025-02-01T10:30:00Z',
    },
    {
      id: 'tle-003',
      eventType: 'approval_granted',
      subject: 'env-001',
      actor: 'chief-security-officer@vvu',
      certificateId: null,
      details: {
        environmentId: 'env-001',
        conditions: ['Production deployment only', 'Audit trail required'],
      },
      timestamp: '2025-01-14T16:00:00Z',
    },
    {
      id: 'tle-004',
      eventType: 'certificate_revoked',
      subject: 'manage-community-pools@vvu',
      actor: 'compliance-officer@vvu',
      certificateId: 'cert-003',
      details: {
        certificateType: 'hsm',
        environmentId: 'env-002',
        reason: 'HSM key compromise detected — rotation initiated',
      },
      timestamp: '2025-03-10T09:15:00Z',
    },
    {
      id: 'tle-005',
      eventType: 'attestation_created',
      subject: 'verify-authenticity@vvu',
      actor: 'proofbridge@vvu',
      certificateId: 'cert-001',
      details: {
        environmentId: 'env-001',
        attestationType: 'replay_verification',
        result: 'PASS',
        validationIndex: 94.2,
      },
      timestamp: '2025-03-12T11:45:00Z',
    },
  ];

  // Trust score: based on active certificates / total certificates
  const activeCertificates = certificates.filter((c) => !c.revokedAt).length;
  const trustScore = Math.round((activeCertificates / certificates.length) * 100);

  return NextResponse.json({
    certificates,
    approvals,
    trustLogEvents,
    trustScore,
    summary: {
      totalCertificates: certificates.length,
      activeCertificates,
      revokedCertificates: certificates.filter((c) => c.revokedAt).length,
      totalApprovals: approvals.length,
      totalLogEvents: trustLogEvents.length,
    },
  });
}
