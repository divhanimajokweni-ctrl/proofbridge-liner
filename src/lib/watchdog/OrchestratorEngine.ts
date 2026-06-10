/**
 * File: src/lib/watchdog/OrchestratorEngine.ts
 * Description: Priority-sorted diagnostic engine running on an eternal clock loop.
 */
import { Incident, OpTag } from './HeartbeatSchema';import { HeartbeatBus } from './HeartbeatBus';
export type OrchestratorStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';export type IncidentHandler = (incident: Incident) => Promise<void> | void;
export class OrchestratorEngine {
  private static instance: OrchestratorEngine | null = null;
  private status: OrchestratorStatus = 'STOPPED';
  private queue: Incident[] = [];
  private handlers: Map<OpTag, IncidentHandler> = new Map();
  private intervalId: any | null = null;
  private unsubscribeBus: (() => void) | null = null;

  private constructor() {
    this.registerBuiltInHandlers();
  }

  public static getInstance(): OrchestratorEngine {
    if (!OrchestratorEngine.instance) {
      OrchestratorEngine.instance = new OrchestratorEngine();
    }
    return OrchestratorEngine.instance;
  }

  public start(): void {
    if (this.status === 'RUNNING') return;
    this.status = 'RUNNING';

    this.unsubscribeBus = HeartbeatBus.getInstance().subscribe((inc) => {
      if (this.status !== 'PAUSED') {
        this.queue.push(inc);
        this.sortQueue();
      }
    });

    this.intervalId = setInterval(() => this.processNext(), 1000);
  }

  public pause(): void { if (this.status === 'RUNNING') this.status = 'PAUSED'; }
  public resume(): void { if (this.status === 'PAUSED') this.status = 'RUNNING'; }

  public stop(): void {
    this.status = 'STOPPED';
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.unsubscribeBus) { this.unsubscribeBus(); this.unsubscribeBus = null; }
    this.queue = [];
  }

  public registerHandler(opTag: OpTag, handler: IncidentHandler): void {
    this.handlers.set(opTag, handler);
  }

  public getStatus(): OrchestratorStatus { return this.status; }

  private sortQueue(): void {
    const priorityWeights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    this.queue.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
  }

  private async processNext(): Promise<void> {
    if (this.status !== 'RUNNING' || this.queue.length === 0) return;
    const incident = this.queue.shift()!;
    const handler = this.handlers.get(incident.opTag) || this.handlers.get(OpTag.UNKNOWN);
    if (handler) {
      try {
        await handler(incident);
      } catch (e) {
        console.error(`Orchestrator critical handler mutation failure on ${incident.opTag}:`, e);
      }
    }
  }

  private registerBuiltInHandlers(): void {
    Object.values(OpTag).forEach(tag => {
      this.registerHandler(tag, (inc) => {
        console.warn(`[WATCHDOG ENGINE - ${inc.priority}] ${inc.opTag}: ${inc.summary}. Hint: ${inc.opHint}`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vvu-remediation-triggered', { detail: inc }));
        }
      });
    });
  }
}