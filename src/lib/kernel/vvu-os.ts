import { z } from 'zod';

// ─── SYSTEM TYPE DEFINITIONS & SCHEMAS ─────────────────────────────────────
export type ProcessStatus = 'READY' | 'RUNNING' | 'BLOCKED' | 'TERMINATED';
export type SubsystemType = 'HARDWARE' | 'EXECUTION' | 'UI' | 'SECURITY';

export interface ProcessControlBlock {
  pid: number;
  name: string;
  subsystem: SubsystemType;
  status: ProcessStatus;
  priority: number;
  cpuCyclesRemaining: number;
  memoryAllocationMB: number;
}

// Validation Schema for incoming Subsystem Execution Payloads
export const KernelExecutionSchema = z.object({
  instructionId: z.string().uuid(),
  subsystem: z.enum(['HARDWARE', 'EXECUTION', 'UI', 'SECURITY']),
  payloadSizeMB: z.number().max(4096),
  requiredCycles: z.number().min(1)
});

export class VVUKernelEngine {
  private activeProcesses: ProcessControlBlock[] = [];
  private pidCounter = 100;
  private cpuSliceQuantum = 20; // Maximum CPU cycles allowed per round-robin tick
  private totalSystemMemory = 16384; // 16GB Total Virtual Array Buffer
  private allocatedMemory = 0;

  constructor() {
    this.bootUpSequence();
  }

  // 1. BOOTSTRAP SEQUENCE LOOPS (Hardware & File Management Initialization)
  private bootUpSequence() {
    console.log("► [BOOT_LOADER] Initializing VVU OS Microkernel Vector...");

    // Core Subsystem Process Registrations
    this.allocateProcess('VVU-HAL-DRV', 'HARDWARE', 5, 40, 512);     // Pillar 1: Hardware Management
    this.allocateProcess('VVU-EXEC-ENG', 'EXECUTION', 4, 60, 1024);   // Pillar 2: Application Execution
    this.allocateProcess('VVU-CLI-SHELL', 'UI', 3, 30, 256);         // Pillar 3: User Interface
    this.allocateProcess('VVU-SAFELINER', 'SECURITY', 5, 50, 512);     // Pillar 4: Security & File Management

    console.log(`🎉 [BOOT_COMPLETE] Memory Map Allocated: ${this.allocatedMemory}/${this.totalSystemMemory}MB.`);
  }

  public allocateProcess(name: string, subsystem: SubsystemType, priority: number, cycles: number, memory: number): number {
    if (this.allocatedMemory + memory > this.totalSystemMemory) {
      throw new Error(`[KERNEL_PANIC] Out of Memory allocation failure for: ${name}`);
    }

    const pid = this.pidCounter++;
    const pcb: ProcessControlBlock = {
      pid,
      name,
      subsystem,
      status: 'READY',
      priority,
      cpuCyclesRemaining: cycles,
      memoryAllocationMB: memory
    };

    this.activeProcesses.push(pcb);
    this.allocatedMemory += memory;
    return pid;
  }

  // 2. PROCESS SCHEDULER ENGINE (Deterministic Round-Robin Kernel Loop)
  public executeSchedulerTick(): string[] {
    const schedulingLogs: string[] = [];

    // Filter out dead threads
    const executableQueue = this.activeProcesses.filter(p => p.status !== 'TERMINATED');

    if (executableQueue.length === 0) {
      return ["[KERNEL_IDLE] No active execution registers found."];
    }

    for (const process of executableQueue) {
      process.status = 'RUNNING';
      const cyclesToExecute = Math.min(process.cpuCyclesRemaining, this.cpuSliceQuantum);
      process.cpuCyclesRemaining -= cyclesToExecute;

      schedulingLogs.push(
        `[PID ${process.pid}][${process.subsystem}] Running thread ${process.name} for ${cyclesToExecute} cycles.`
      );

      if (process.cpuCyclesRemaining <= 0) {
        process.status = 'TERMINATED';
        this.allocatedMemory -= process.memoryAllocationMB;
        schedulingLogs.push(`✔ [PROCESS_TERMINATED] Freed ${process.memoryAllocationMB}MB from PID ${process.pid}.`);
      } else {
        process.status = 'READY'; // Sent back to back of queue ring
      }
    }

    return schedulingLogs;
  }

  public getSystemState() {
    return {
      memoryUsed: this.allocatedMemory,
      totalMemory: this.totalSystemMemory,
      threads: [...this.activeProcesses]
    };
  }
}
