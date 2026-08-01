export type ExecutionDecision = 'COMMIT' | 'REVIEW' | 'REVIVE' | 'BLOCK';

export interface EvidencePackage {
  assetId: string;
  ipfsCid: string;
  expectedHash: string;
  actualHash: string;
  match: boolean;
}

export interface ValidatorReport {
  documentValid: boolean;
  rules: Record<string, boolean>;
}

export interface ScorerOutput {
  triggerScore: number;
  classification: string;
  posteriorMean: number;
}

export interface AuditChainEntry {
  id: string;
  prevHash: string | null;
  payload: Record<string, unknown>;
  timestamp: number;
  chainHash?: string;
}

export interface QueenOrchestration {
  executionId: string;
  decision: ExecutionDecision;
  evidence: EvidencePackage;
  validatorReport: ValidatorReport;
  scorerOutput: ScorerOutput;
  auditEntry: AuditChainEntry;
  timestamp: number;
}

export interface QueenConfig {
  onDecision?: (orchestration: QueenOrchestration) => Promise<void> | void;
}

export class ANTQueen {
  private config: QueenConfig;

  constructor(config: QueenConfig) {
    this.config = config;
  }

  async authorizeExecution(
    orchestration: QueenOrchestration
  ): Promise<QueenOrchestration> {
    if (this.config.onDecision) {
      await this.config.onDecision(orchestration);
    }

    return orchestration;
  }
}
