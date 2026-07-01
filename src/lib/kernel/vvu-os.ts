import { z } from 'zod';
import {
  SubsystemType,
  ProcessReservation,
  RESERVED_PROCESSES,
  OS_PILLARS,
  MEMORY_REGIONS,
  PID_RANGES,
  resolvePidRange,
  lookupReservation,
  isReservedName,
} from './vvu-registry';

// ─── SYSTEM TYPE DEFINITIONS & SCHEMAS ─────────────────────────────────────
export type ProcessStatus = 'READY' | 'RUNNING' | 'BLOCKED' | 'TERMINATED';

export type { SubsystemType };

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
  private pidCounter: Record<string, number> = {};
  private cpuSliceQuantum = 20;
  private totalSystemMemory = 16384; // 16 GB virtual address space
  private allocatedMemory = 0;

  constructor() {
    this.bootUpSequence();
  }

  // 1. BOOTSTRAP SEQUENCE — boot reserved processes from the registry
  private bootUpSequence() {
    console.log("► [BOOT_LOADER] Initializing VVU OS Microkernel Vector...");

    // Initialize PID counters per range from the registry
    for (const [name, range] of Object.entries(PID_RANGES)) {
      this.pidCounter[name] = range.start;
    }

    // Print OS pillars
    for (const [key, pillar] of Object.entries(OS_PILLARS)) {
      console.log(`   ${key}: ${pillar.label} — ${pillar.description}`);
    }
    console.log('');

    // Boot all reserved processes from the registry
    for (const reservation of RESERVED_PROCESSES) {
      this.allocateFromReservation(reservation);
    }

    console.log(`🎉 [BOOT_COMPLETE] Memory Map Allocated: ${this.allocatedMemory}/${this.totalSystemMemory}MB.`);
  }

  // Allocate a process using its reservation entry
  private allocateFromReservation(reservation: ProcessReservation): number {
    const pid = this.pidCounter[reservation.pidRange]++;
    const pcb: ProcessControlBlock = {
      pid,
      name: reservation.name,
      subsystem: reservation.subsystem,
      status: 'READY',
      priority: reservation.priority,
      cpuCyclesRemaining: reservation.cycles,
      memoryAllocationMB: reservation.memoryMB,
    };
    this.activeProcesses.push(pcb);
    this.allocatedMemory += reservation.memoryMB;
    return pid;
  }

  // 2. ALLOCATE PROCESS — supports both reserved and user-spawned processes
  public allocateProcess(name: string, subsystem: SubsystemType, priority: number, cycles: number, memory: number): number {
    if (this.allocatedMemory + memory > this.totalSystemMemory) {
      throw new Error(`[KERNEL_PANIC] Out of Memory allocation failure for: ${name}`);
    }

    // Use reserved configuration if the name is a known system process
    const reservation = lookupReservation(name);
    if (reservation) {
      return this.allocateFromReservation(reservation);
    }

    // User-spawned process — use USER PID range
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
      priority,
      cpuCyclesRemaining: cycles,
      memoryAllocationMB: memory,
    };
    this.activeProcesses.push(pcb);
    this.allocatedMemory += memory;
    return pid;
  }

  // 3. PROCESS SCHEDULER ENGINE (Deterministic Round-Robin Kernel Loop)
  public executeSchedulerTick(): string[] {
    const schedulingLogs: string[] = [];

    const executableQueue = this.activeProcesses.filter(p => p.status !== 'TERMINATED');

    if (executableQueue.length === 0) {
      return ["[KERNEL_IDLE] No active execution registers found."];
    }

    for (const process of executableQueue) {
      process.status = 'RUNNING';
      const cyclesToExecute = Math.min(process.cpuCyclesRemaining, this.cpuSliceQuantum);
      process.cpuCyclesRemaining -= cyclesToExecute;

      const pidRange = resolvePidRange(process.pid);
      const pillarInfo = OS_PILLARS[process.subsystem];

      schedulingLogs.push(
        `[PID ${process.pid}][${pidRange}] Running process ${process.name} (${pillarInfo.label}) for ${cyclesToExecute} cycles.`
      );

      if (process.cpuCyclesRemaining <= 0) {
        process.status = 'TERMINATED';
        this.allocatedMemory -= process.memoryAllocationMB;
        schedulingLogs.push(`✔ [PROCESS_TERMINATED] ${process.name} freed ${process.memoryAllocationMB}MB from PID ${process.pid} (${pidRange}).`);
      } else {
        process.status = 'READY';
      }
    }

    return schedulingLogs;
  }

  public getSystemState() {
    return {
      memoryUsed: this.allocatedMemory,
      totalMemory: this.totalSystemMemory,
      reservedMemory: RESERVED_PROCESSES.reduce((sum, r) => sum + r.memoryMB, 0),
      threads: [...this.activeProcesses]
    };
  }
}

// Re-export registry types and helpers for consumers
export {
  OS_PILLARS,
  PID_RANGES,
  RESERVED_PROCESSES,
  MEMORY_REGIONS,
  resolvePidRange,
  lookupReservation,
  isReservedName,
};
