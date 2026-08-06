/**
 * VVU OS — Operator Types
 * Each operator is a real working process managed by the kernel.
 */

export interface OperatorStatus {
  pid: number;
  name: string;
  subsystem: SubsystemType;
  state: 'INIT' | 'RUNNING' | 'ERROR' | 'STOPPED';
  uptimeMs: number;
  lastActivity: string | null;
  errorCount: number;
}

export type SubsystemType = 'HARDWARE' | 'EXECUTION' | 'UI' | 'SECURITY';

export interface OperatorCommand {
  command: string;
  args?: Record<string, unknown>;
  timeout?: number;
}

export interface OperatorResult {
  success: boolean;
  data: unknown;
  error?: string;
  durationMs: number;
}

export interface IOperator {
  /** Operator name (matches registry reservation) */
  readonly name: string;
  /** Kernel-assigned PID */
  pid: number;
  /** Subsystem classification */
  readonly subsystem: SubsystemType;
  /** Start the operator — called during kernel boot */
  start(): Promise<void>;
  /** Stop the operator — called during shutdown */
  stop(): Promise<void>;
  /** Get current status snapshot */
  status(): OperatorStatus;
  /** Execute a command routed to this operator */
  execute(command: string, args?: Record<string, unknown>): Promise<OperatorResult>;
}
