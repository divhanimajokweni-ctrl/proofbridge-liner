/**
 * VVU OS — Operatus System Runtime
 *
 * The init/systemd equivalent for VVU OS:
 * - Boots the microkernel with registered operators
 * - Manages real process lifecycle (start/stop/status)
 * - Provides control surface for War Room gateway
 * - Routes commands to the correct operator
 * - Persists audit state across the system lifecycle
 *
 * This is a SINGLETON — initialized on first import and lives
 * for the duration of the Node.js process.
 */

import { VVUMicrokernelV2, ProcessControlBlock } from './vvu-os-v2';
import { RESERVED_PROCESSES, resolvePidRange, OS_PILLARS, SECURITY_POLICIES, MEMORY_REGIONS } from './vvu-registry';
import { IOperator, OperatorResult, OperatorStatus, SubsystemType } from './operators/types';
import { HALDrvOperator } from './operators/hal-drv';
import { SafelinerOperator } from './operators/safeline';
import { SafeKrypteOperator } from './operators/safekrypte';
import { AuditBusOperator } from './operators/audit-bus';
import { PID_RANGES } from './vvu-registry';
import * as os from 'os';
import * as crypto from 'crypto';

// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface SystemStatus {
  kernel: {
    pid: number;
    uptime: number;
    memoryUsed: number;
    totalMemory: number;
    panicked: boolean;
    panicReason: string;
    schedulerCycles: number;
    totalProcessesSpawned: number;
  };
  operators: OperatorStatus[];
  registry: {
    reservedProcesses: number;
    pidRanges: Record<string, { start: number; end: number }>;
    memoryRegions: typeof MEMORY_REGIONS;
    securityPolicies: typeof SECURITY_POLICIES;
  };
  environment: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    pid: number;
    uptime: number;
  };
}

export interface OperatusCommand {
  target: string;       // Operator name or 'kernel' or 'system'
  command: string;
  args?: Record<string, unknown>;
}

export interface OperatusCommandResult {
  success: boolean;
  operator: string;
  command: string;
  result: OperatorResult;
  timestamp: string;
}

// ─── OPERATOR FACTORY ──────────────────────────────────────────────────────

// Maps reserved process names to their operator implementations
const OPERATOR_IMPL: Record<string, new () => IOperator> = {
  'VVU-HAL-DRV': HALDrvOperator,
  'VVU-SAFELINER': SafelinerOperator,
  'VVU-SAFEKRIPTE': SafeKrypteOperator,
  'VVU-AUDIT-BUS': AuditBusOperator,
};

// ─── OPERATUS (SINGLETON) ──────────────────────────────────────────────────

class VVUOperatusImpl {
  private kernel!: VVUMicrokernelV2;
  private operators: Map<string, IOperator> = new Map();
  private operatorPidMap: Map<number, IOperator> = new Map();
  private bootedAt: number = 0;
  private schedulerCycles: number = 0;
  private totalProcessesSpawned: number = 0;
  private commandHistory: OperatusCommandResult[] = [];
  private initialized = false;

  /**
   * Initialize the system: boot kernel, spawn and start operators.
   * Safe to call multiple times — only runs once.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    this.bootedAt = Date.now();
    this.kernel = new VVUMicrokernelV2();
    this.initialized = true;

    // Spawn and start each operator implementation
    for (const [name, OperatorClass] of Object.entries(OPERATOR_IMPL)) {
      const operator = new OperatorClass();
      const pid = this.kernel.spawnProcess(
        name,
        operator.subsystem,
        5,  // priority
        100, // cycles
        64,  // memory MB
      );

      operator.pid = pid;
      await operator.start();

      this.operators.set(name, operator);
      this.operatorPidMap.set(pid, operator);
      this.totalProcessesSpawned++;

      // Log to audit bus
      const audit = this.getOperator('VVU-AUDIT-BUS') as AuditBusOperator | undefined;
      if (audit) {
        await audit.execute('log-event', {
          source: 'OPERATUS',
          type: 'OPERATOR_START',
          severity: 'INFO',
          message: `Operator ${name} started with PID ${pid}`,
          metadata: { pid, subsystem: operator.subsystem },
        });
      }
    }
  }

  /**
   * Execute a command against the operatus system.
   * Commands can target:
   *   - An operator name (e.g. 'VVU-HAL-DRV')
   *   - 'kernel'  → kernel-level operations
   *   - 'system'  → system-level operations
   */
  async execute(cmd: OperatusCommand): Promise<OperatusCommandResult> {
    await this.init();

    const start = Date.now();
    let result: OperatorResult;

    switch (cmd.target.toUpperCase()) {
      case 'KERNEL':
        result = await this.executeKernelCommand(cmd.command, cmd.args);
        break;
      case 'SYSTEM':
        result = await this.executeSystemCommand(cmd.command, cmd.args);
        break;
      default: {
        const operator = this.operators.get(cmd.target);
        if (!operator) {
          result = {
            success: false,
            data: null,
            error: `OPERATUS: unknown target '${cmd.target}' — use one of: ${Array.from(this.operators.keys()).join(', ')}, kernel, system`,
            durationMs: Date.now() - start,
          };
        } else {
          result = await operator.execute(cmd.command, cmd.args);
        }
        break;
      }
    }

    const entry: OperatusCommandResult = {
      success: result.success,
      operator: cmd.target,
      command: cmd.command,
      result,
      timestamp: new Date().toISOString(),
    };

    this.commandHistory.push(entry);
    if (this.commandHistory.length > 100) {
      this.commandHistory = this.commandHistory.slice(-50);
    }

    return entry;
  }

  /**
   * Get full system status.
   */
  getStatus(): SystemStatus {
    const snapshot = this.kernel?.getKernelSnapshot();

    return {
      kernel: {
        pid: process.pid,
        uptime: this.bootedAt ? Date.now() - this.bootedAt : 0,
        memoryUsed: snapshot?.memoryUsed ?? 0,
        totalMemory: snapshot?.totalMemory ?? 16384,
        panicked: snapshot?.isPanicked ?? false,
        panicReason: snapshot?.panicReason ?? '',
        schedulerCycles: this.schedulerCycles,
        totalProcessesSpawned: this.totalProcessesSpawned,
      },
      operators: Array.from(this.operators.values()).map(op => op.status()),
      registry: {
        reservedProcesses: RESERVED_PROCESSES.length,
        pidRanges: Object.fromEntries(
          Object.entries(PID_RANGES).map(([name, range]) => [
            name,
            { start: range.start, end: range.end },
          ])
        ),
        memoryRegions: MEMORY_REGIONS,
        securityPolicies: SECURITY_POLICIES,
      },
      environment: {
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        pid: process.pid,
        uptime: os.uptime(),
      },
    };
  }

  /**
   * Run one scheduler cycle.
   */
  runSchedulerTick(): string[] {
    if (!this.kernel) return ['[OPERATUS] Kernel not initialized'];
    this.schedulerCycles++;
    return this.kernel.dispatchSchedulerCycle();
  }

  /**
   * Send IPC message between processes.
   */
  sendIPC(senderPid: number, receiverPid: number, payload: string): string {
    if (!this.kernel) return '[OPERATUS] Kernel not initialized';
    return this.kernel.sendIPCMessage({ senderPid, receiverPid, payload });
  }

  /**
   * Trigger kernel panic.
   */
  panic(reason: string): void {
    if (this.kernel) {
      this.kernel.triggerKernelPanic(reason);
    }
  }

  /**
   * Cold reboot — reinitialize everything.
   */
  async reboot(): Promise<void> {
    this.kernel?.clearPanicReset();
    this.operators.clear();
    this.operatorPidMap.clear();
    this.initialized = false;
    this.schedulerCycles = 0;
    this.totalProcessesSpawned = 0;
    await this.init();
  }

  /**
   * Get command history.
   */
  getCommandHistory(): OperatusCommandResult[] {
    return [...this.commandHistory];
  }

  /**
   * Get a specific operator by name.
   */
  getOperator(name: string): IOperator | undefined {
    return this.operators.get(name);
  }

  /**
   * Get all running operators.
   */
  getOperators(): Map<string, IOperator> {
    return new Map(this.operators);
  }

  // ─── INTERNAL COMMAND HANDLERS ──────────────────────────────────────────

  private async executeKernelCommand(command: string, args?: Record<string, unknown>): Promise<OperatorResult> {
    const start = Date.now();
    switch (command) {
      case 'status':
        return {
          success: true,
          data: this.getStatus(),
          durationMs: Date.now() - start,
        };
      case 'scheduler-tick':
        return {
          success: true,
          data: this.runSchedulerTick(),
          durationMs: Date.now() - start,
        };
      case 'spawn-process': {
        const name = String(args?.name ?? '');
        const subsystem = String(args?.subsystem ?? 'EXECUTION') as SubsystemType;
        const priority = Number(args?.priority ?? 3);
        const cycles = Number(args?.cycles ?? 50);
        const memory = Number(args?.memory ?? 32);
        try {
          const pid = this.kernel!.spawnProcess(name, subsystem, priority, cycles, memory);
          this.totalProcessesSpawned++;
          return {
            success: true,
            data: { pid, name, subsystem, priority, cycles, memory },
            durationMs: Date.now() - start,
          };
        } catch (err) {
          return {
            success: false,
            data: null,
            error: `KERNEL: ${err instanceof Error ? err.message : String(err)}`,
            durationMs: Date.now() - start,
          };
        }
      }
      case 'panic':
        this.panic(String(args?.reason ?? 'Manual panic trigger'));
        return {
          success: true,
          data: { panicked: true, reason: args?.reason ?? 'Manual panic trigger' },
          durationMs: Date.now() - start,
        };
      case 'reboot':
        await this.reboot();
        return {
          success: true,
          data: { rebooted: true, at: new Date().toISOString() },
          durationMs: Date.now() - start,
        };
      case 'ipc': {
        const senderPid = Number(args?.senderPid ?? 0);
        const receiverPid = Number(args?.receiverPid ?? 0);
        const payload = String(args?.payload ?? '');
        return {
          success: true,
          data: this.sendIPC(senderPid, receiverPid, payload),
          durationMs: Date.now() - start,
        };
      }
      default:
        return {
          success: false,
          data: null,
          error: `KERNEL: unknown command '${command}' — available: status, scheduler-tick, spawn-process, panic, reboot, ipc`,
          durationMs: Date.now() - start,
        };
    }
  }

  private async executeSystemCommand(command: string, args?: Record<string, unknown>): Promise<OperatorResult> {
    const start = Date.now();
    switch (command) {
      case 'ping':
        return {
          success: true,
          data: { pong: true, timestamp: new Date().toISOString(), uptime: os.uptime() },
          durationMs: Date.now() - start,
        };
      case 'env':
        return {
          success: true,
          data: Object.fromEntries(
            Object.entries(process.env)
              .filter(([k]) => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('TOKEN') && !k.includes('PASSWORD'))
              .map(([k, v]) => [k, v ?? ''])
          ),
          durationMs: Date.now() - start,
        };
      case 'process-list': {
        const processes = this.kernel?.getKernelSnapshot().processes ?? [];
        return {
          success: true,
          data: processes.map((p: ProcessControlBlock) => ({
            pid: p.pid,
            name: p.name,
            subsystem: p.subsystem,
            status: p.status,
            priority: p.priority,
            memoryMB: p.memoryAllocationMB,
            cyclesRemaining: p.cpuCyclesRemaining,
          })),
          durationMs: Date.now() - start,
        };
      }
      case 'command-history':
        return {
          success: true,
          data: this.getCommandHistory().slice(-20),
          durationMs: Date.now() - start,
        };
      default:
        return {
          success: false,
          data: null,
          error: `SYSTEM: unknown command '${command}' — available: ping, env, process-list, command-history`,
          durationMs: Date.now() - start,
        };
    }
  }
}

// Export singleton instance
export const Operatus = new VVUOperatusImpl();

// NOTE: Auto-init on import is DISABLED to prevent side-effects in Next.js routes.
// Call `await Operatus.init()` explicitly at your application entrypoint.
// To re-enable auto-init, uncomment the block below:
// if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
//   Operatus.init().catch(err => {
//     console.error('[OPERATUS] Initialization error:', err);
//   });
// }
