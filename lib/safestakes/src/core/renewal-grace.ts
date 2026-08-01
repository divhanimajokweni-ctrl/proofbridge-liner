export interface UnderwritingRenewalEvent {
  renewalId: string;
  previousEventId: string;
  poolId: string;
  policyHash: string;
  newEventId: string;
  signature: string;
  renewedAt: number;
}

export interface QueuedIncident {
  incident: {
    reportId: string;
    incidentType: string;
  };
  queuedAt: number;
  idempotencyKey: string;
}

const RENEWAL_NOTIFICATION_MS = 7 * 24 * 60 * 60 * 1000;
const GRACE_WINDOW_MS = 2 * 60 * 60 * 1000;
const GRACE_LIVENESS_CHECK_MS = 15 * 60 * 1000;

class RenewalStateMachine {
  private coverageState: "COVERED" | "RENEWAL_PENDING" | "IN_GRACE" | "UNCOVERED" = "COVERED";
  private activeEvent: any = null;
  private queuedIncidents: QueuedIncident[] = [];

  constructor(private poolId: string, private policyHash: string) {}

  async transition(newState: string, event?: any): Promise<void> {
    console.log(`[RENEWAL] Pool ${this.poolId}: transitioning to ${newState}`);
    this.coverageState = newState as any;
  }

  async queueDuringGrace(incident: any, idempotencyKey: string): Promise<any> {
    if (this.coverageState !== "IN_GRACE") {
      return { allowed: false, executed: false };
    }
    this.queuedIncidents.push({ incident, queuedAt: Date.now(), idempotencyKey });
    return { decisionId: `queued-${idempotencyKey}`, allowed: false, executed: false };
  }

  async processRenewal(renewal: UnderwritingRenewalEvent): Promise<boolean> {
    const signatureValid = await this.verifyRenewalSignature({ renewalId: renewal.renewalId }, renewal.signature);
    if (!signatureValid) return false;
    await this.transition("COVERED");
    return true;
  }

  private async verifyRenewalSignature(payload: any, signature: string): Promise<boolean> {
    const response = await fetch("http://localhost:3001/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature }),
    });
    const result = await response.json();
    return result.valid;
  }

  getState(): string {
    return this.coverageState;
  }
}

export { RenewalStateMachine, GRACE_WINDOW_MS, RENEWAL_NOTIFICATION_MS };