// ═══════════════════════════════════════════════════════════════════════════════
// VVU OS — Process Name Reservation & System Configuration Registry
// ═══════════════════════════════════════════════════════════════════════════════
// This is the single source of truth for:
//   • Reserved process names and their subsystem allocations
//   • PID range reservations (kernel-space vs user-space)
//   • Memory region maps (RAM allocation per subsystem)
//   • Priority tier definitions (critical → idle)
//   • Device driver registration (printers, peripherals)
//   • Security policy assignments (SafeLiner ACLs, SafeKrypte key tiers)
//   • Virtual file system mount points
// ═══════════════════════════════════════════════════════════════════════════════
import { z } from 'zod';

// ─── SUBSYSTEM TYPES ─────────────────────────────────────────────────────────
export type SubsystemType = 'HARDWARE' | 'EXECUTION' | 'UI' | 'SECURITY';

export const SubsystemSchema = z.enum(['HARDWARE', 'EXECUTION', 'UI', 'SECURITY']);

// ─── OS PILLAR MAPPING ───────────────────────────────────────────────────────
// Maps the four OS pillars to VVU subsystems and their descriptions.
export const OS_PILLARS = {
  HARDWARE: {
    label: 'Hardware Management',
    description: 'Device Control — Employs background device drivers to safely communicate with hardware peripherals like printers.',
    subsystems: ['HAL-DRV', 'HAL-PRINTER', 'HAL-STORAGE'],
  },
  EXECUTION: {
    label: 'Application Execution',
    description: 'CPU Scheduling — Allocates central processing unit (CPU) time efficiently among running tasks.',
    subsystems: ['EXEC-ENG', 'MISTRAL-CONTAINER', 'SCHEDULER'],
  },
  UI: {
    label: 'User Interface',
    description: 'File Management — Organizes, names, stores, and protects directory trees and user files.',
    subsystems: ['CLI-SHELL', 'DASHBOARD', 'TERMINAL'],
  },
  SECURITY: {
    label: 'Security & File Management',
    description: 'Data Security — Restricts system access to block unauthorized intrusions or malware. Coordinates RAM allocation and dynamically tracks used and free space.',
    subsystems: ['SAFELINER', 'SAFEKRYPTE', 'AUDIT-BUS'],
  },
} as const;

// ─── PID RANGE RESERVATIONS ──────────────────────────────────────────────────
// Each subsystem owns a reserved PID block. This prevents namespace collisions
// and ensures processes can be identified by PID range alone.
export const PID_RANGES = {
  KERNEL:    { start: 0,   end: 99,   label: 'Kernel Space',        owner: 'KERNEL' },
  HARDWARE:  { start: 100, end: 199,  label: 'Hardware Drivers',    owner: 'HARDWARE' },
  EXECUTION: { start: 200, end: 299,  label: 'Execution Engines',   owner: 'EXECUTION' },
  UI:        { start: 300, end: 399,  label: 'User Interface',       owner: 'UI' },
  SECURITY:  { start: 400, end: 499,  label: 'Security & Audit',    owner: 'SECURITY' },
  USER:      { start: 500, end: 999,  label: 'User Applications',   owner: 'USER' },
} as const;

export type PidRangeName = keyof typeof PID_RANGES;

/** Resolve which PID range a given PID belongs to. */
export function resolvePidRange(pid: number): PidRangeName {
  for (const [name, range] of Object.entries(PID_RANGES)) {
    if (pid >= range.start && pid <= range.end) return name as PidRangeName;
  }
  throw new Error(`[REGISTRY_ERROR] PID ${pid} falls outside all reserved ranges.`);
}

// ─── PRIORITY TIERS ──────────────────────────────────────────────────────────
// Maps VVU priority values to OS scheduling concepts.
export const PRIORITY_TIERS = {
  CRITICAL: { value: 5, label: 'Critical — Kernel / Security', quantum: 30 },
  HIGH:     { value: 4, label: 'High — System Processes',       quantum: 25 },
  NORMAL:   { value: 3, label: 'Normal — User Applications',    quantum: 20 },
  LOW:      { value: 2, label: 'Low — Background Tasks',        quantum: 15 },
  IDLE:     { value: 1, label: 'Idle — Batch / Maintenance',    quantum: 10 },
} as const;

export type PriorityTierName = keyof typeof PRIORITY_TIERS;

export function resolvePriorityTier(priority: number): PriorityTierName {
  for (const [name, t] of Object.entries(PRIORITY_TIERS)) {
    if (t.value === priority) return name as PriorityTierName;
  }
  return 'NORMAL';
}

// ─── RESERVED PROCESS NAMES ──────────────────────────────────────────────────
// Every boot-critical process is registered here with its fixed configuration.
// User-spawned processes use dynamic allocation and are NOT in this table.

export interface ProcessReservation {
  name: string;
  subsystem: SubsystemType;
  pidRange: PidRangeName;
  priority: number;
  memoryMB: number;
  cycles: number;
  description: string;
  osPillar: keyof typeof OS_PILLARS;
}

export const RESERVED_PROCESSES: ProcessReservation[] = [
  // ─── HARDWARE (Pillar 1) ──────────────────────────────────────────────
  {
    name: 'VVU-HAL-DRV',
    subsystem: 'HARDWARE',
    pidRange: 'HARDWARE',
    priority: 5,
    memoryMB: 512,
    cycles: 40,
    description: 'Device Control — Core hardware abstraction layer. Manages device drivers, IRQ routing, and peripheral register access.',
    osPillar: 'HARDWARE',
  },
  {
    name: 'VVU-HAL-PRINTER',
    subsystem: 'HARDWARE',
    pidRange: 'HARDWARE',
    priority: 2,
    memoryMB: 128,
    cycles: 20,
    description: 'Device Control — Printer spooler driver. Buffers print jobs, negotiates PCL/postScript, manages paper tray state.',
    osPillar: 'HARDWARE',
  },
  {
    name: 'VVU-HAL-STORAGE',
    subsystem: 'HARDWARE',
    pidRange: 'HARDWARE',
    priority: 4,
    memoryMB: 256,
    cycles: 60,
    description: 'Device Control — Block storage driver. Manages disk I/O queues, partition tables, and DMA transfers.',
    osPillar: 'HARDWARE',
  },

  // ─── EXECUTION (Pillar 2) ──────────────────────────────────────────────
  {
    name: 'VVU-EXEC-ENG',
    subsystem: 'EXECUTION',
    pidRange: 'EXECUTION',
    priority: 4,
    memoryMB: 1024,
    cycles: 60,
    description: 'CPU Scheduling — Application execution engine. Dispatches user-space threads, manages process lifecycle (fork/exec/wait/exit).',
    osPillar: 'EXECUTION',
  },
  {
    name: 'VVU-SCHEDULER',
    subsystem: 'EXECUTION',
    pidRange: 'EXECUTION',
    priority: 5,
    memoryMB: 256,
    cycles: 80,
    description: 'CPU Scheduling — Round-robin / priority-preemptive scheduler core. Allocates CPU time slices among running tasks.',
    osPillar: 'EXECUTION',
  },
  {
    name: 'VVU-MISTRAL',
    subsystem: 'EXECUTION',
    pidRange: 'EXECUTION',
    priority: 4,
    memoryMB: 2048,
    cycles: 120,
    description: 'CPU Scheduling — AI inference container. Runs heuristic models for fraud detection, risk scoring, and compliance verification.',
    osPillar: 'EXECUTION',
  },

  // ─── UI / FILE MANAGEMENT (Pillar 3) ────────────────────────────────────
  {
    name: 'VVU-CLI-SHELL',
    subsystem: 'UI',
    pidRange: 'UI',
    priority: 3,
    memoryMB: 256,
    cycles: 30,
    description: 'File Management — Interactive CLI shell. Organizes, names, stores, and protects directory trees and user files. Provides terminal access to the VVU filesystem.',
    osPillar: 'UI',
  },
  {
    name: 'VVU-DASHBOARD',
    subsystem: 'UI',
    pidRange: 'UI',
    priority: 3,
    memoryMB: 512,
    cycles: 40,
    description: 'File Management — Kernel telemetry dashboard. Renders live PCB tables, memory maps, and scheduler traces to the operator.',
    osPillar: 'UI',
  },
  {
    name: 'VVU-TERMINAL',
    subsystem: 'UI',
    pidRange: 'UI',
    priority: 2,
    memoryMB: 128,
    cycles: 20,
    description: 'File Management — Virtual terminal multiplexer. Manages pseudo-TTY sessions, input buffering, and scrollback.',
    osPillar: 'UI',
  },

  // ─── SECURITY / MEMORY MANAGEMENT (Pillar 4) ────────────────────────────
  {
    name: 'VVU-SAFELINER',
    subsystem: 'SECURITY',
    pidRange: 'SECURITY',
    priority: 5,
    memoryMB: 512,
    cycles: 50,
    description: 'Data Security + Memory Management — Primary security monitor. Enforces mandatory access control (MAC), restricts system call gates, audits file access. Coordinates RAM allocation and tracks used/free memory pages.',
    osPillar: 'SECURITY',
  },
  {
    name: 'VVU-SAFEKRIPTE',
    subsystem: 'SECURITY',
    pidRange: 'SECURITY',
    priority: 5,
    memoryMB: 1024,
    cycles: 60,
    description: 'Data Security — Cryptographic key management. Generates, stores, and rotates ED25519/FROST-DAML key material. Provides threshold escrow (3-of-5 / 5-of-7). Attests signed credentials.',
    osPillar: 'SECURITY',
  },
  {
    name: 'VVU-AUDIT-BUS',
    subsystem: 'SECURITY',
    pidRange: 'SECURITY',
    priority: 4,
    memoryMB: 256,
    cycles: 40,
    description: 'Data Security — Compliance audit event bus. Monitors all process spawns, IPC messages, file access, and memory allocations. Writes immutable audit trail. Triggers SafeLiner on policy violations.',
    osPillar: 'SECURITY',
  },
];

// Index reservations by name for O(1) lookup.
export const RESERVED_PROCESSES_BY_NAME: Record<string, ProcessReservation> = {};
for (const r of RESERVED_PROCESSES) {
  RESERVED_PROCESSES_BY_NAME[r.name] = r;
}

/** Look up a reserved process by name. Returns undefined for user-spawned processes. */
export function lookupReservation(name: string): ProcessReservation | undefined {
  return RESERVED_PROCESSES_BY_NAME[name];
}

/** Check if a process name is reserved (system-critical). */
export function isReservedName(name: string): boolean {
  return name in RESERVED_PROCESSES_BY_NAME;
}

/** Given a subsystem, return all reserved processes that belong to it. */
export function getReservationsBySubsystem(subsystem: SubsystemType): ProcessReservation[] {
  return RESERVED_PROCESSES.filter(r => r.subsystem === subsystem);
}

// ─── MEMORY REGION MAP ───────────────────────────────────────────────────────
// Divides the 16 GB virtual address space into logical regions.
// Each region has a purpose, owner subsystem, and access policy.

export interface MemoryRegion {
  label: string;
  startAddrMB: number;
  sizeMB: number;
  owner: SubsystemType | 'KERNEL';
  access: 'KERNEL_ONLY' | 'SUBSYSTEM' | 'USER';
  description: string;
}

export const MEMORY_REGIONS: MemoryRegion[] = [
  {
    label: 'Kernel Vector Table',
    startAddrMB: 0,
    sizeMB: 512,
    owner: 'KERNEL',
    access: 'KERNEL_ONLY',
    description: 'Reserved for kernel PCB arrays, scheduler state, interrupt vector table.',
  },
  {
    label: 'Hardware I/O Buffer',
    startAddrMB: 512,
    sizeMB: 1024,
    owner: 'HARDWARE',
    access: 'SUBSYSTEM',
    description: 'Device driver DMA buffers, IRQ mailboxes, MMIO mappings for peripherals (printers, storage, network).',
  },
  {
    label: 'Execution Heap',
    startAddrMB: 1536,
    sizeMB: 4096,
    owner: 'EXECUTION',
    access: 'SUBSYSTEM',
    description: 'User-space process heaps, thread stacks, IPC message pools. Managed by EXEC-ENG.',
  },
  {
    label: 'UI Framebuffer',
    startAddrMB: 5632,
    sizeMB: 1024,
    owner: 'UI',
    access: 'SUBSYSTEM',
    description: 'Terminal framebuffer, dashboard render cache, glyph raster store.',
  },
  {
    label: 'Security Enclave',
    startAddrMB: 6656,
    sizeMB: 2048,
    owner: 'SECURITY',
    access: 'KERNEL_ONLY',
    description: 'SafeKrypte key material vault. SafeLiner ACL cache. Audit log ring buffer. Accessible only via kernel syscall gate.',
  },
  {
    label: 'User Application Space',
    startAddrMB: 8704,
    sizeMB: 7680,
    owner: 'KERNEL',
    access: 'USER',
    description: 'General-purpose memory for user-spawned processes. Allocated on demand by the scheduler.',
  },
];

export function getMemoryRegionForSubsystem(subsystem: SubsystemType): MemoryRegion[] {
  return MEMORY_REGIONS.filter(r => r.owner === subsystem || r.owner === 'KERNEL');
}

export function getReservedMemoryTotal(): number {
  return MEMORY_REGIONS.reduce((sum, r) => sum + r.sizeMB, 0);
}

// ─── DEVICE DRIVER REGISTRY ──────────────────────────────────────────────────
// Registers hardware peripherals and their associated device drivers.

export interface DeviceDriver {
  name: string;
  deviceClass: 'PRINTER' | 'STORAGE' | 'NETWORK' | 'DISPLAY' | 'INPUT' | 'CRYPTO' | 'AUDIT';
  driverProcess: string; // Reserved process name that owns this driver
  irqChannel: number;
  mmioBase?: number;
  description: string;
}

export const DEVICE_DRIVERS: DeviceDriver[] = [
  {
    name: 'printer-spooler',
    deviceClass: 'PRINTER',
    driverProcess: 'VVU-HAL-PRINTER',
    irqChannel: 7,
    mmioBase: 0x3F00,
    description: 'Parallel/serial printer spooler. Supports PCL, PostScript, and raw bitmap pass-through.',
  },
  {
    name: 'nvme-stack',
    deviceClass: 'STORAGE',
    driverProcess: 'VVU-HAL-STORAGE',
    irqChannel: 10,
    mmioBase: 0x4000,
    description: 'NVMe block storage driver. Queue depth 256, 4K sector DMA transfers.',
  },
  {
    name: 'hsm-interface',
    deviceClass: 'CRYPTO',
    driverProcess: 'VVU-SAFEKRIPTE',
    irqChannel: 12,
    description: 'Hardware security module interface. FROST-DAML threshold signing, ED25519 key generation.',
  },
  {
    name: 'audit-logger',
    deviceClass: 'AUDIT',
    driverProcess: 'VVU-AUDIT-BUS',
    irqChannel: 14,
    description: 'Immutable audit log writer. WAL-backed, SOC2-compliant event stream.',
  },
];

// ─── VIRTUAL FILE SYSTEM MOUNT POINTS ────────────────────────────────────────
// VVU OS virtual directory structure. Maps to OS pillars.

export interface VfsMountPoint {
  path: string;
  owner: SubsystemType | 'KERNEL';
  access: 'READ_WRITE' | 'READ_ONLY' | 'KERNEL_ONLY';
  description: string;
}

export const VFS_MOUNTS: VfsMountPoint[] = [
  { path: '/kernel',     owner: 'KERNEL',   access: 'KERNEL_ONLY',  description: 'Kernel binary, module images, boot params.' },
  { path: '/drivers',    owner: 'HARDWARE', access: 'READ_ONLY',    description: 'Device driver firmware blobs and configuration.' },
  { path: '/dev',        owner: 'HARDWARE', access: 'READ_WRITE',   description: 'Device file nodes — printer, storage, crypto.' },
  { path: '/exec',       owner: 'EXECUTION', access: 'READ_WRITE',  description: 'Executable binaries, shared libraries, process temp.' },
  { path: '/home',       owner: 'UI',       access: 'READ_WRITE',   description: 'User home directories and configuration files.' },
  { path: '/etc',        owner: 'SECURITY', access: 'KERNEL_ONLY',  description: 'System-wide ACL policies, SafeLiner rules, audit config.' },
  { path: '/var/log',    owner: 'SECURITY', access: 'READ_ONLY',    description: 'Audit trail, kernel logs, IPC message archives.' },
  { path: '/crypto',     owner: 'SECURITY', access: 'KERNEL_ONLY',  description: 'Key material vault, cert store, FROST-DAML shares.' },
];

// ─── SECURITY POLICY MATRIX ──────────────────────────────────────────────────
// Describes which access control policies each process enforces.

export interface SecurityPolicy {
  processName: string;
  policies: string[];
}

export const SECURITY_POLICIES: SecurityPolicy[] = [
  {
    processName: 'VVU-SAFELINER',
    policies: [
      'MAC_ENFORCE — Mandatory Access Control on all syscall gates',
      'FILE_ACL — Read/write/execute permissions on VFS mount points',
      'MEMORY_WATCH — Tracks allocation limits; triggers KernelPanic on OOM',
      'PROCESS_AUDIT — Logs every spawn/terminate to the audit bus',
    ],
  },
  {
    processName: 'VVU-SAFEKRIPTE',
    policies: [
      'KEY_ESCROW — 3-of-5 internal / 5-of-7 institutional threshold keys',
      'ATTESTATION — Signs VCs with ED25519, verifies VCT governance chain',
      'HSM_GATE — All key operations pass through hsm-interface device driver',
    ],
  },
  {
    processName: 'VVU-AUDIT-BUS',
    policies: [
      'IMMUTABLE_LOG — WAL-backed append-only audit trail',
      'CIRCUIT_BREAKER — Monitors event throughput; halts on anomaly',
      'ALERT_ROUTING — Forwards policy violations to SafeLiner for action',
    ],
  },
];
