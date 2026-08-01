/**
 * Telemetry types shared between the WebSocket server and frontend.
 */

/** System-level snapshot — emitted every tick (~1000ms) */
export interface CpuSnapshot {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  /** Total CPU usage percent (100 - idle) */
  totalPercent: number;
}

export interface MemorySnapshot {
  totalKb: number;
  freeKb: number;
  availableKb: number;
  buffersKb: number;
  cachedKb: number;
  /** Usage percent based on available memory */
  usedPercent: number;
}

export interface LoadSnapshot {
  load1: number;
  load5: number;
  load15: number;
  running: number;
  total: number;
}

export interface DockerContainerStats {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
  memoryPercent: number;
  netInputMb: number;
  netOutputMb: number;
  pids: number;
  uptimeMs: number;
}

export interface ProcessRecord {
  pid: number;
  name: string;
  state: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRssKb: number;
  user: string;
  command: string;
}

export interface TelemetrySnapshot {
  timestamp: number;
  cpu: CpuSnapshot;
  memory: MemorySnapshot;
  load: LoadSnapshot;
  processes: ProcessRecord[];
  docker: DockerContainerStats[];
}

/** Time-bucketed data point for charts */
export interface TimeSeriesPoint {
  t: number;
  cpu: number;
  memory: number;
  load: number;
}

/** WebSocket message envelope */
export type TelemetryMessage =
  | { type: 'telemetry:pulse'; data: TelemetrySnapshot }
  | { type: 'telemetry:timeseries'; data: TimeSeriesPoint[] }
  | { type: 'telemetry:error'; message: string }
  | { type: 'command:exec'; command: string; args: string; pid: string }
  | { type: 'command:result'; success: boolean; output: string; pid: string };

/** Command execution request */
export interface CommandRequest {
  type: 'command:exec';
  command: 'kill' | 'restart' | 'signal';
  args: { pid?: number; signal?: string; container?: string };
}

/** Ring buffer configuration */
export const RING_BUFFER_SIZE = 300;
export const TELEMETRY_PORT = Number(process.env.TELEMETRY_PORT || 3001);
export const TELEMETRY_INTERVAL_MS = Number(process.env.TELEMETRY_INTERVAL_MS || 1000);
