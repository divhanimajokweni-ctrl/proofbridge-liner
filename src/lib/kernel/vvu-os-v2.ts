import { z } from 'zod';
import {
  SubsystemType,
  RESERVED_PROCESSES,
  RESERVED_PROCESSES_BY_NAME,
  PID_RANGES,
  PRIORITY_TIERS,
  MEMORY_REGIONS,
  resolvePidRange,
  resolvePriorityTier,
  lookupReservation,
  OS_PILLARS,
  SECURITY_POLICIES,
  DEVICE_DRIVERS,
} from './vvu-registry';

// ─── TYPE DEFINITIONS ──────────────────────────────────────────────────────
export type ProcessStatus = 'READY' | 'RUNNING' | 'BLOCKED' | 'TERMINATED';
export type { SubsystemType };

// ─── IPC MESSAGE ENVELOPE ──────────────────────────────────────────────────
export const IPCMessageSchema = z.object({
  messageId: z.string().uuid(),
  senderPid: z.number(),
  receiverPid: z.number(),
  payload: z.string().max(256),
  timestamp: z.number()
});

export type IPCMessage = z.infer<typeof IPCMessageSchema>;

// ─── PROCESS CONTROL BLOCK ─────────────────────────────────────────────────
export interface ProcessControlBlock {
  pid: number;
  name: string;
  subsystem: SubsystemType;
  status: ProcessStatus;
  priority: number;
  cpuCyclesRemaining: number;
  memoryAllocationMB: number;
  mailbox: IPCMessage[];
}

// ─── MICROKERNEL V2 ENGINE ─────────────────────────────────────────────────
export class VVUMicrokernelV2 {
  private activeProcesses: ProcessControlBlock[] = [];
  private pidCounter: Record<string, number> = {};
  private totalSystemMemory = 16384;
  private allocatedMemory = 0;
  private isPanicked = false;
  private panicReason = '';

  constructor() {
    this.coldBootBootstrap();
  }

  private coldBootBootstrap() {
    this.isPanicked = false;
    this.allocatedMemory = 0;
    this.activeProcesses = [];

    // Initialize PID counters per range from registry
    for (const [name, range] of Object.entries(PID_RANGES)) {
      this.pidCounter[name] = range.start;
    }

    // Boot reserved processes: HARDWARE, SECURITY, UI, EXECUTION
    for (const reservation of RESERVED_PROCESSES) {
      this.spawnFromReservation(reservation);
    }
  }

  private spawnFromReservation(reservation: typeof RESERVED_PROCESSES[number]): number {
    if (this.isPanicked) throw new Error('[KERNEL_ERROR] Write instruction blocked: System state set to PANIC.');

    const pid = this.pidCounter[reservation.pidRange]++;
    const pcb: ProcessControlBlock = {
      pid,
      name: reservation.name,
      subsystem: reservation.subsystem,
      status: 'READY',
      priority: reservation.priority,
      cpuCyclesRemaining: reservation.cycles,
      memoryAllocationMB: reservation.memoryMB,
      mailbox: [],
    };

    this.activeProcesses.push(pcb);
    this.allocatedMemory += reservation.memoryMB;
    return pid;
  }

  public spawnProcess(name: string, subsystem: SubsystemType, priority: number, cycles: number, memory: number): number {
    if (this.isPanicked) throw new Error('[KERNEL_ERROR] Write instruction blocked: System state set to PANIC.');

    if (this.allocatedMemory + memory > this.totalSystemMemory) {
      this.triggerKernelPanic(`MEMORY_SEGMENTATION_FAULT: Process [${name}] requested ${memory}MB but only ${this.totalSystemMemory - this.allocatedMemory}MB remains.`);
      throw new Error('[KERNEL_PANIC] System state crashed due to catastrophic out-of-memory error.');
    }

    // Reserved process? Use registry config.
    const reservation = lookupReservation(name);
    if (reservation) {
      return this.spawnFromReservation(reservation);
    }

    // User-spawned — use USER PID range
    const rangeKey = 'USER';
    if (!this.pidCounter[rangeKey]) {
      this.pidCounter[rangeKey] = PID_RANGES.USER.start;
    }
    const pid = this.pidCounter[rangeKey]++;
    const pcb: ProcessControlBlock = {
      pid,
      name,
      subsystem,
      status: 'READY',
      priority: Math.max(1, Math.min(5, priority)),
      cpuCyclesRemaining: cycles,
      memoryAllocationMB: memory,
      mailbox: [],
    };

    this.activeProcesses.push(pcb);
    this.allocatedMemory += memory;
    return pid;
  }

  // 1. DYNAMIC INTER-PROCESS COMMUNICATION (IPC) PIPELINE
  public sendIPCMessage(rawMessage: Omit<IPCMessage, 'messageId' | 'timestamp'>): string {
    if (this.isPanicked) return '[BLOCKED] Kernel memory stack locked.';

    try {
      const validatedEnvelope = IPCMessageSchema.parse({
        ...rawMessage,
        messageId: crypto.randomUUID(),
        timestamp: Date.now()
      });

      const receiver = this.activeProcesses.find(p => p.pid === validatedEnvelope.receiverPid && p.status !== 'TERMINATED');
      if (!receiver) {
        return `⚠️ [IPC_FAULT] Target process PID ${validatedEnvelope.receiverPid} unreachable or terminated.`;
      }

      receiver.mailbox.push(validatedEnvelope);

      if (receiver.status === 'BLOCKED') {
        receiver.status = 'READY';
      }

      return `✉️ [IPC_SUCCESS] Thread ${validatedEnvelope.senderPid} dispatched message to Thread ${validatedEnvelope.receiverPid}.`;
    } catch (err) {
      return `❌ [IPC_VALIDATION_ERROR] Dropped malformed message frame payload.`;
    }
  }

  // 2. PRIORITY-PREEMPTIVE PROCESS SCHEDULER
  public dispatchSchedulerCycle(): string[] {
    if (this.isPanicked) return [`[SYSTEM_HALTED] Kernel core panic trace active: ${this.panicReason}`];

    const cycleTraceLogs: string[] = [];

    // Sort by priority descending, then by remaining cycles
    this.activeProcesses.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.cpuCyclesRemaining - a.cpuCyclesRemaining;
    });

    const nextRunnableProcess = this.activeProcesses.find(p => p.status === 'READY');
    if (!nextRunnableProcess) {
      return ["[KERNEL_IDLE] Awaiting incoming task blocks or unblocking thread execution signals."];
    }

    // Preemption
    this.activeProcesses.forEach(p => {
      if (p.status === 'RUNNING' && p.pid !== nextRunnableProcess.pid) {
        p.status = 'READY';
        const preemptedReservation = lookupReservation(p.name);
        const preemptedInfo = preemptedReservation
          ? `${p.name} (${OS_PILLARS[p.subsystem].label})`
          : p.name;
        const nextReservation = lookupReservation(nextRunnableProcess.name);
        const nextInfo = nextReservation
          ? `${nextRunnableProcess.name} (${OS_PILLARS[nextRunnableProcess.subsystem].label})`
          : nextRunnableProcess.name;
        cycleTraceLogs.push(
          `⚡ [PREEMPTION] ${preemptedInfo} preempted by ${nextInfo} (PRIORITY ${nextRunnableProcess.priority} > ${p.priority}).`
        );
      }
    });

    // Execute
    nextRunnableProcess.status = 'RUNNING';
    const priorityTier = resolvePriorityTier(nextRunnableProcess.priority);
    const quantum = PRIORITY_TIERS[priorityTier].quantum;
    const executionSlice = Math.min(nextRunnableProcess.cpuCyclesRemaining, quantum);
    nextRunnableProcess.cpuCyclesRemaining -= executionSlice;

    const pidRange = resolvePidRange(nextRunnableProcess.pid);
    const pillarLabel = OS_PILLARS[nextRunnableProcess.subsystem]?.label ?? nextRunnableProcess.subsystem;
    cycleTraceLogs.push(
      `⚙️ [EXEC_TICK] PID ${nextRunnableProcess.pid} (${pidRange}) ${nextRunnableProcess.name} | ${pillarLabel} | PRIORITY_${nextRunnableProcess.priority} (${priorityTier}) | quantum ${executionSlice} cycles.`
    );

    // Read mailbox
    if (nextRunnableProcess.mailbox.length > 0) {
      const unreadMail = nextRunnableProcess.mailbox.shift()!;
      const senderReservation = this.activeProcesses.find(p => p.pid === unreadMail.senderPid);
      const senderName = senderReservation?.name ?? `PID ${unreadMail.senderPid}`;
      cycleTraceLogs.push(`📩 [IPC_READ] ${nextRunnableProcess.name} read message from ${senderName}: "${unreadMail.payload}"`);
    }

    // Lifecycle
    if (nextRunnableProcess.cpuCyclesRemaining <= 0) {
      nextRunnableProcess.status = 'TERMINATED';
      this.allocatedMemory -= nextRunnableProcess.memoryAllocationMB;
      cycleTraceLogs.push(
        `✔ [THREAD_EXIT] ${nextRunnableProcess.name} (${pillarLabel}) finished. Freed ${nextRunnableProcess.memoryAllocationMB}MB from ${pidRange}.`
      );
    } else {
      nextRunnableProcess.status = 'READY';
    }

    return cycleTraceLogs;
  }

  // 3. AUTOMATED KERNEL PANIC GUARD INTERCEPTOR
  public triggerKernelPanic(reason: string) {
    this.isPanicked = true;
    this.panicReason = reason;
    this.activeProcesses.forEach(p => p.status = 'BLOCKED');
  }

  public clearPanicReset() {
    this.coldBootBootstrap();
  }

  public getKernelSnapshot() {
    return {
      memoryUsed: this.allocatedMemory,
      totalMemory: this.totalSystemMemory,
      isPanicked: this.isPanicked,
      panicReason: this.panicReason,
      reservedMemory: RESERVED_PROCESSES.reduce((sum, r) => sum + r.memoryMB, 0),
      totalReservedProcesses: RESERVED_PROCESSES.length,
      processes: [...this.activeProcesses],
      memoryRegions: MEMORY_REGIONS,
      securityPolicies: SECURITY_POLICIES,
      deviceDrivers: DEVICE_DRIVERS,
    };
  }
}

// Re-export registry
export {
  OS_PILLARS,
  PID_RANGES,
  PRIORITY_TIERS,
  RESERVED_PROCESSES,
  MEMORY_REGIONS,
  SECURITY_POLICIES,
  DEVICE_DRIVERS,
  resolvePidRange,
  resolvePriorityTier,
  lookupReservation,
};
