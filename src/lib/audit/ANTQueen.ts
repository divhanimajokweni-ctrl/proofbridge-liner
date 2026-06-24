/**
 * VVU ANT Safety Kernel - Compliance Fabric v2
 * Layer 5: ANT Queen Orchestrator
 */

import { EvidencePackage } from '../../lib/watchdog/../..//prover/fetcher'; // Adjusting to likely locations based on previous exploration
import { ValidatorReport } from '../../lib/watchdog/../..//prover/validator';
import { ScorerOutput } from '../../lib/watchdog/../..//prover/scorer';
import { AuditChainEntry } from './auditService'; 

export type ExecutionDecision = 'COMMIT' | 'REVIEW' | 'REVIVE' | 'BLOCK';

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
    
    // Proactive Observability Hook
    if (this.config.onDecision) {
      await this.config.onDecision(orchestration);
    }

    return orchestration;
  }
}
