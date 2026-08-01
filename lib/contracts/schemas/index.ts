// Stub types for external schemas - replace with actual schemas in production
export interface MetricProof {
  proofId: string;
  poolId: string;
  policyHash: string;
  metricType: string;
  metricWindowStart: number;
  metricWindowEnd: number;
  value: number;
  sourceService: string;
  signerPubKey: string;
  createdAt: number;
  signature: string;
}

export interface EscrowAgreement {
  escrowId: string;
  depositorSignature: string;
  amountCents: number;
  currency: string;
  expiresAt: number;
  poolId: string;
  depositorPubKey: string;
  beneficiaryPubKey: string;
  releaseCondition: { type: string; params: Record<string, unknown> };
}

export interface EscrowReleaseAuthorization {
  escrowId: string;
  releaseId: string;
  authorizedBy: string;
  releaseReason: string;
  releaseAmountCents: number;
  timestamp: number;
  signature: string;
}

export interface IncidentReport {
  reportId: string;
  poolId: string;
  policyHash: string;
  incidentType: string;
  metricRefs: string[];
  evidenceHash: string;
  reporterPubKeys: string[];
  reporterSignatures: string[];
  assembledAt: number;
  nonce: number;
}