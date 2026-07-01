import { z } from 'zod';

// ─── TYPE DEFINITIONS ──────────────────────────────────────────────────────
export type ProcessStatus = 'READY' | 'RUNNING' | 'BLOCKED' | 'TERMINATED';
export type SubsystemType = 'HARDWARE' | 'EXECUTION' | 'UI' | 'SECURITY';

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
  priority: number; // 1 (Lowest) to 5 (Highest / Core Critical)
  cpuCyclesRemaining: number;
  memoryAllocationMB: number;
  mailbox: IPCMessage[];
}

// ─── MICROKERNEL V2 ENGINE ─────────────────────────────────────────────────
export class VVUMicrokernelV2 {
  private activeProcesses: ProcessControlBlock[] = [];
  private pidCounter = 200;
  private totalSystemMemory = 16384; // 16GB RAM Buffer limit
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

    // Provision Core Operating System Subsystem Anchors
    this.spawnProcess('HAL-CORE', 'HARDWARE', 5, 80, 512);      // Priority 5 (Kernel Space)
    this.spawnProcess('SECURITY-GATE', 'SECURITY', 5, 60, 1024); // Priority 5 (Kernel Space)
    this.spawnProcess('CLI-RUNTIME', 'UI', 3, 40, 256);         // Priority 3 (User Space)
    this.spawnProcess('MISTRAL-CONTAINER', 'EXECUTION', 4, 120, 2048); // Priority 4 (System Space)
  }

  public spawnProcess(name: string, subsystem: SubsystemType, priority: number, cycles: number, memory: number): number {
    if (this.isPanicked) throw new Error('[KERNEL_ERROR] Write instruction blocked: System state set to PANIC.');

    if (this.allocatedMemory + memory > this.totalSystemMemory) {
      this.triggerKernelPanic(`MEMORY_SEGMENTATION_FAULT: Process [${name}] requested ${memory}MB but only ${this.totalSystemMemory - this.allocatedMemory}MB remains.`);
      throw new Error('[KERNEL_PANIC] System state crashed due to catastrophic out-of-memory error.');
    }

    const pid = this.pidCounter++;
    const pcb: ProcessControlBlock = {
      pid,
      name,
      subsystem,
      status: 'READY',
      priority: Math.max(1, Math.min(5, priority)),
      cpuCyclesRemaining: cycles,
      memoryAllocationMB: memory,
      mailbox: []
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

      // Unblock target process automatically if it was idling/waiting for an input block
      if (receiver.status === 'BLOCKED') {
        receiver.status = 'READY';
      }

      return `✉️ [IPC_SUCCESS] Thread ${validatedEnvelope.senderPid} dispatched message payload frame directly to Thread ${validatedEnvelope.receiverPid}.`;
    } catch (err) {
      return `❌ [IPC_VALIDATION_ERROR] Dropped malformed message frame payload.`;
    }
  }

  // 2. PRIORITY-PREEMPTIVE PROCESS SCHEDULER
  public dispatchSchedulerCycle(): string[] {
    if (this.isPanicked) return [`[SYSTEM_HALTED] Kernel core panic trace active: ${this.panicReason}`];

    const cycleTraceLogs: string[] = [];

    // Sort array queue: Highest Priority (5) first, breaking ties via highest remaining execution load
    this.activeProcesses.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.cpuCyclesRemaining - a.cpuCyclesRemaining;
    });

    const nextRunnableProcess = this.activeProcesses.find(p => p.status === 'READY');

    if (!nextRunnableProcess) {
      return ["[KERNEL_IDLE] Awaiting incoming task blocks or unblocking thread execution signals."];
    }

    // Capture Preemption event trace logs if another thread was running previously
    this.activeProcesses.forEach(p => {
      if (p.status === 'RUNNING' && p.pid !== nextRunnableProcess.pid) {
        p.status = 'READY';
        cycleTraceLogs.push(`⚡ [PREEMPTION] Context Switch triggered! Thread ${p.name} bumped out by higher priority thread ${nextRunnableProcess.name}.`);
      }
    });

    // Execute active process thread slice
    nextRunnableProcess.status = 'RUNNING';
    const executionSlice = Math.min(nextRunnableProcess.cpuCyclesRemaining, 25);
    nextRunnableProcess.cpuCyclesRemaining -= executionSlice;

    cycleTraceLogs.push(`⚙️ [EXEC_TICK] PID ${nextRunnableProcess.pid} (${nextRunnableProcess.name}) running at PRIORITY_${nextRunnableProcess.priority} for ${executionSlice} cycles.`);

    // Read thread mail frames inside runtime scope block
    if (nextRunnableProcess.mailbox.length > 0) {
      const unreadMail = nextRunnableProcess.mailbox.shift();
      cycleTraceLogs.push(`📩 [IPC_READ] PID ${nextRunnableProcess.pid} read dynamic message frame from PID ${unreadMail?.senderPid}: "${unreadMail?.payload}"`);
    }

    // Handle Thread Lifecycles
    if (nextRunnableProcess.cpuCyclesRemaining <= 0) {
      nextRunnableProcess.status = 'TERMINATED';
      this.allocatedMemory -= nextRunnableProcess.memoryAllocationMB;
      cycleTraceLogs.push(`✔ [THREAD_EXIT] PID ${nextRunnableProcess.pid} (${nextRunnableProcess.name}) finished processing. Freed ${nextRunnableProcess.memoryAllocationMB}MB.`);
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
      processes: [...this.activeProcesses]
    };
  }
}
