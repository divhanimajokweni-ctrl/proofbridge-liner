/**
 * telemetry-server.ts
 *
 * WebSocket server that collects system telemetry (/proc, Docker) and
 * broadcasts to all connected dashboard clients at 1s intervals.
 *
 * Run: npx tsx server/telemetry-server.ts
 * Port: 3001 (configurable via TELEMETRY_PORT env)
 */
import { WebSocketServer, WebSocket } from 'ws';
import { readCpuWithDelta, readMemory, readLoad, readProcesses } from './lib/proc-collector';
import { collectDockerStats } from './lib/docker-collector';
import {
  TELEMETRY_PORT,
  TELEMETRY_INTERVAL_MS,
  RING_BUFFER_SIZE,
  TelemetrySnapshot,
  TimeSeriesPoint,
  TelemetryMessage,
} from './lib/telemetry-types';

// ─── Ring Buffer ────────────────────────────────────────────────────────

class RingBuffer {
  private buffer: TimeSeriesPoint[] = [];
  private maxSize: number;

  constructor(maxSize: number = RING_BUFFER_SIZE) {
    this.maxSize = maxSize;
  }

  push(point: TimeSeriesPoint): void {
    this.buffer.push(point);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll(): TimeSeriesPoint[] {
    return [...this.buffer];
  }

  get size(): number {
    return this.buffer.length;
  }
}

const ringBuffer = new RingBuffer();

// ─── Telemetry Collector ────────────────────────────────────────────────

async function collectSnapshot(): Promise<TelemetrySnapshot> {
  const [cpu, memory, load, processes, docker] = await Promise.all([
    Promise.resolve().then(() => readCpuWithDelta()),
    Promise.resolve().then(() => readMemory()),
    Promise.resolve().then(() => readLoad()),
    Promise.resolve().then(() => readProcesses(300)),
    collectDockerStats(),
  ]);

  const timestamp = Date.now();

  return {
    timestamp,
    cpu: cpu ?? { user: 0, nice: 0, system: 0, idle: 0, iowait: 0, irq: 0, softirq: 0, steal: 0, totalPercent: 0 },
    memory: memory ?? { totalKb: 0, freeKb: 0, availableKb: 0, buffersKb: 0, cachedKb: 0, usedPercent: 0 },
    load: load ?? { load1: 0, load5: 0, load15: 0, running: 0, total: 1 },
    processes,
    docker,
  };
}

// ─── Command Executor ───────────────────────────────────────────────────

function executeCommand(command: string, args: any): { success: boolean; output: string } {
  switch (command) {
    case 'kill': {
      const pid = Number(args?.pid);
      if (!pid || pid <= 0) return { success: false, output: 'Invalid PID' };
      const signal = args?.signal || 'SIGTERM';
      try {
        process.kill(pid, signal);
        return { success: true, output: `PID ${pid} sent ${signal}` };
      } catch (err: any) {
        return { success: false, output: `kill failed: ${err.message}` };
      }
    }
    case 'ping':
      return { success: true, output: 'pong' };
    default:
      return { success: false, output: `Unknown command: ${command}` };
  }
}

// ─── WebSocket Server ───────────────────────────────────────────────────

const wss = new WebSocketServer({ port: TELEMETRY_PORT });

console.log(`[telemetry] WebSocket server starting on port ${TELEMETRY_PORT}`);
console.log(`[telemetry] Interval: ${TELEMETRY_INTERVAL_MS}ms | Ring buffer: ${RING_BUFFER_SIZE}`);

wss.on('listening', () => {
  console.log(`[telemetry] WebSocket server listening on ws://0.0.0.0:${TELEMETRY_PORT}`);
});

wss.on('connection', (ws: WebSocket, req) => {
  const clientIp = req.socket.remoteAddress || 'unknown';
  const clientId = `${clientIp}:${Date.now()}`;
  console.log(`[telemetry] Client connected: ${clientId} (total: ${wss.clients.size})`);

  // Send full ring buffer history on connect
  const history: TelemetryMessage = {
    type: 'telemetry:timeseries',
    data: ringBuffer.getAll(),
  };
  ws.send(JSON.stringify(history));

  // Handle incoming commands
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'command:exec') {
        const result = executeCommand(msg.command, msg.args);
        const response: TelemetryMessage = {
          type: 'command:result',
          success: result.success,
          output: result.output,
          pid: msg.pid || '',
        };
        ws.send(JSON.stringify(response));
        console.log(`[telemetry] Command executed: ${msg.command} -> ${result.output}`);
      }
    } catch (err) {
      console.error(`[telemetry] Invalid message from ${clientId}:`, err);
    }
  });

  ws.on('close', () => {
    console.log(`[telemetry] Client disconnected: ${clientId} (total: ${wss.clients.size})`);
  });

  ws.on('error', (err) => {
    console.error(`[telemetry] Client error ${clientId}:`, err.message);
  });
});

// ─── Broadcast Loop ─────────────────────────────────────────────────────

let tickCount = 0;

async function broadcastTick(): Promise<void> {
  tickCount++;
  try {
    const snapshot = await collectSnapshot();

    // Push to ring buffer
    ringBuffer.push({
      t: snapshot.timestamp,
      cpu: snapshot.cpu.totalPercent,
      memory: snapshot.memory.usedPercent,
      load: snapshot.load.load1,
    });

    const message: TelemetryMessage = {
      type: 'telemetry:pulse',
      data: snapshot,
    };

    const payload = JSON.stringify(message);
    let sent = 0;

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sent++;
      }
    });

    if (tickCount % 10 === 0) {
      console.log(`[telemetry] Tick #${tickCount} — broadcast to ${sent} clients | ` +
        `CPU: ${snapshot.cpu.totalPercent}% | Mem: ${snapshot.memory.usedPercent}% | ` +
        `Procs: ${snapshot.processes.length} | Docker: ${snapshot.docker.length}`);
    }
  } catch (err) {
    console.error('[telemetry] Broadcast error:', err);
    const errorMsg: TelemetryMessage = {
      type: 'telemetry:error',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(errorMsg));
      }
    });
  }
}

// Start broadcast loop
setInterval(broadcastTick, TELEMETRY_INTERVAL_MS);

// Also run an immediate first tick
broadcastTick();

// ─── Graceful shutdown ──────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n[telemetry] Shutting down...');
  wss.close(() => {
    console.log('[telemetry] WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[telemetry] SIGTERM received — shutting down...');
  wss.close(() => {
    process.exit(0);
  });
});

// ─── Status for health checks ───────────────────────────────────────────

export { wss, ringBuffer, collectSnapshot };

console.log(`[telemetry] Server ready. Connect clients to ws://localhost:${TELEMETRY_PORT}`);
