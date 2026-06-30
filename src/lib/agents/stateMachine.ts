export type AgentState = 'IDLE' | 'PROCESSING' | 'SANDBOX_VALIDATION' | 'COMPLIANCE_HOLD' | 'ROUTING' | 'COMPLETED' | 'FAILED';
export type AgentEvent = 'INITIATE' | 'RECEIVE_PAYLOAD' | 'PASS_SANDBOX' | 'FAIL_SECURITY' | 'APPROVE_COMPLIANCE' | 'DISPATCH' | 'RESET';

interface ConversationContext {
  agentId: string;
  sessionId: string;
  payloadHistory: Array<{ step: AgentState; timestamp: string; data: unknown }>;
  errorLog?: string;
}

const TRANSITIONS: Record<AgentState, Partial<Record<AgentEvent, AgentState>>> = {
  IDLE:               { INITIATE: 'PROCESSING' },
  PROCESSING:         { RECEIVE_PAYLOAD: 'SANDBOX_VALIDATION', RESET: 'IDLE' },
  SANDBOX_VALIDATION: { PASS_SANDBOX: 'ROUTING', FAIL_SECURITY: 'COMPLIANCE_HOLD' },
  COMPLIANCE_HOLD:    { APPROVE_COMPLIANCE: 'ROUTING', RESET: 'FAILED' },
  ROUTING:            { DISPATCH: 'COMPLETED', RESET: 'FAILED' },
  COMPLETED:          { INITIATE: 'PROCESSING', RESET: 'IDLE' },
  FAILED:             { RESET: 'IDLE' },
};

export class AgentStateMachine {
  private currentState: AgentState = 'IDLE';
  private context: ConversationContext;

  constructor(agentId: string, sessionId: string) {
    this.context = { agentId, sessionId, payloadHistory: [] };
  }

  getState(): AgentState { return this.currentState; }
  getContext(): ConversationContext { return { ...this.context, payloadHistory: [...this.context.payloadHistory] }; }

  transition(event: AgentEvent, payload: unknown = null): AgentState {
    const nextState = TRANSITIONS[this.currentState]?.[event];
    if (!nextState) {
      this.context.errorLog = `Illegal state transition: ${this.currentState} -> [${event}]`;
      this.currentState = 'FAILED';
      this.recordStep(payload);
      return this.currentState;
    }
    this.currentState = nextState;
    this.recordStep(payload);
    return this.currentState;
  }

  private recordStep(payload: unknown): void {
    this.context.payloadHistory.push({
      step: this.currentState,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  }
}
