/**
 * VVU OS — HAL-DRV Operator
 * Hardware Abstraction Layer Driver
 * Provides real system introspection: CPU, memory, disk, network, uptime.
 */

import * as os from 'os';
import { IOperator, OperatorStatus, OperatorResult, SubsystemType } from './types';

export class HALDrvOperator implements IOperator {
  readonly name = 'VVU-HAL-DRV';
  readonly subsystem: SubsystemType = 'HARDWARE';
  pid: number = 0;

  private startedAt: number = 0;
  private lastActivity: string | null = null;
  private errorCount = 0;
  private state: OperatorStatus['state'] = 'INIT';

  async start(): Promise<void> {
    this.state = 'RUNNING';
    this.startedAt = Date.now();
    this.lastActivity = new Date().toISOString();
  }

  async stop(): Promise<void> {
    this.state = 'STOPPED';
    this.lastActivity = new Date().toISOString();
  }

  status(): OperatorStatus {
    return {
      pid: this.pid,
      name: this.name,
      subsystem: this.subsystem,
      state: this.state,
      uptimeMs: this.startedAt ? Date.now() - this.startedAt : 0,
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
    };
  }

  async execute(command: string, args?: Record<string, unknown>): Promise<OperatorResult> {
    const start = Date.now();
    this.lastActivity = new Date().toISOString();

    try {
      switch (command) {
        case 'system-info':
          return this.systemInfo(start);
        case 'cpu-info':
          return this.cpuInfo(start);
        case 'memory-info':
          return this.memoryInfo(start);
        case 'network-info':
          return this.networkInfo(start);
        case 'disk-info':
          return this.diskInfo(start);
        case 'uptime':
          return this.uptimeInfo(start);
        default:
          return {
            success: false,
            data: null,
            error: `HAL-DRV: unknown command '${command}'`,
            durationMs: Date.now() - start,
          };
      }
    } catch (err) {
      this.errorCount++;
      return {
        success: false,
        data: null,
        error: `HAL-DRV error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
      };
    }
  }

  private systemInfo(start: number): OperatorResult {
    return {
      success: true,
      data: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        type: os.type(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        uptime: os.uptime(),
        loadAvg: os.loadavg(),
        networkInterfaces: Object.keys(os.networkInterfaces()),
      },
      durationMs: Date.now() - start,
    };
  }

  private cpuInfo(start: number): OperatorResult {
    const cpus = os.cpus();
    return {
      success: true,
      data: {
        count: cpus.length,
        model: cpus[0]?.model ?? 'unknown',
        speed: cpus[0]?.speed ?? 0,
        times: cpus.map((c, i) => ({
          core: i,
          user: c.times.user,
          nice: c.times.nice,
          sys: c.times.sys,
          idle: c.times.idle,
          irq: c.times.irq,
        })),
        loadAvg: os.loadavg(),
      },
      durationMs: Date.now() - start,
    };
  }

  private memoryInfo(start: number): OperatorResult {
    return {
      success: true,
      data: {
        totalBytes: os.totalmem(),
        freeBytes: os.freemem(),
        usedBytes: os.totalmem() - os.freemem(),
        usagePercent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1) + '%',
        freePercent: ((os.freemem() / os.totalmem()) * 100).toFixed(1) + '%',
      },
      durationMs: Date.now() - start,
    };
  }

  private networkInfo(start: number): OperatorResult {
    const interfaces = os.networkInterfaces();
    const data: Record<string, unknown[]> = {};
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      data[name] = addrs.map(a => ({
        family: a.family,
        address: a.address,
        netmask: a.netmask,
        mac: a.mac,
        internal: a.internal,
        cidr: a.cidr,
      }));
    }
    return {
      success: true,
      data,
      durationMs: Date.now() - start,
    };
  }

  private async diskInfo(start: number): Promise<OperatorResult> {
    try {
      const fs = await import('fs');
      const { execSync } = await import('child_process');
      let mounts: unknown[] = [];
      try {
        const df = execSync('df -h 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 3000 });
        mounts = df.trim().split('\n').slice(1).filter(Boolean).map(line => {
          const parts = line.split(/\s+/);
          return {
            filesystem: parts[0] ?? '',
            size: parts[1] ?? '',
            used: parts[2] ?? '',
            available: parts[3] ?? '',
            usePercent: parts[4] ?? '',
            mounted: parts[5] ?? '',
          };
        });
      } catch {
        // df not available, skip
      }
      return {
        success: true,
        data: {
          mounts,
          cwd: {
            path: process.cwd(),
            available: 'N/A (no df)',
          },
        },
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: true, // partial success
        data: { mounts: [], note: 'disk info limited in this environment' },
        durationMs: Date.now() - start,
      };
    }
  }

  private uptimeInfo(start: number): OperatorResult {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    return {
      success: true,
      data: {
        uptimeSeconds: uptime,
        human: `${days}d ${hours}h ${mins}m`,
        booted: new Date(Date.now() - uptime * 1000).toISOString(),
        processUptime: process.uptime(),
      },
      durationMs: Date.now() - start,
    };
  }
}
