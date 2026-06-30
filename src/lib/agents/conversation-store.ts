import { AgentStateMachine, AgentState, AgentEvent } from './stateMachine';

interface LegacyMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class UnifiedConversationStore {
  private stateMachine: AgentStateMachine;
  private messageHistory: LegacyMessage[] = [];

  constructor(agentId: string, sessionId: string) {
    this.stateMachine = new AgentStateMachine(agentId, sessionId);
  }

  getMessages(): LegacyMessage[] { return [...this.messageHistory]; }
  getCurrentStatus(): AgentState { return this.stateMachine.getState(); }
  getContext() { return this.stateMachine.getContext(); }

  pushAgentPayload(event: AgentEvent, role: LegacyMessage['role'], content: string) {
    const finalState = this.stateMachine.transition(event, { preview: content.slice(0, 60) });
    this.messageHistory.push({
      id: crypto.randomUUID(),
      role,
      content: finalState === 'FAILED'
        ? `[STATE_FAILURE] ${this.stateMachine.getContext().errorLog}\n${content}`
        : content,
    });
  }

  forceEmergencyReset() {
    this.stateMachine.transition('RESET');
    this.messageHistory = [];
  }
}
