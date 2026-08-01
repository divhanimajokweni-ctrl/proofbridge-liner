/**
 * docker-collector.ts
 *
 * Connects to the Docker daemon via /var/run/docker.sock to scrape
 * container stats (CPU, memory, network, state).
 *
 * Falls back gracefully if Docker socket is unavailable.
 */
import * as net from 'node:net';
import type { DockerContainerStats } from './telemetry-types';

// ─── Low-level Docker socket request ───────────────────────────────────

async function dockerSocketRequest(
  method: string,
  path: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = net.createConnection('/var/run/docker.sock', () => {
      client.write(`${method} ${path} HTTP/1.1\r\nHost: localhost\r\n\r\n`);
    });

    let data = '';
    client.on('data', (chunk) => {
      data += chunk.toString();
    });
    client.on('end', () => {
      // Strip HTTP headers: find the double newline
      const bodyStart = data.indexOf('\r\n\r\n');
      if (bodyStart === -1) return resolve(data);
      resolve(data.slice(bodyStart + 4));
    });
    client.on('error', (err) => reject(err));
    client.setTimeout(3000, () => {
      client.destroy();
      reject(new Error('Docker socket timeout'));
    });
  });
}

// ─── List containers ────────────────────────────────────────────────────

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
}

async function listContainers(): Promise<DockerContainer[]> {
  try {
    const raw = await dockerSocketRequest('GET', '/v1.47/containers/json?all=true');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── Stats for a single container ───────────────────────────────────────

interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number; percpu_usage?: number[] };
    system_cpu_usage: number;
    online_cpus: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
    stats?: { cache?: number };
  };
  networks?: Record<string, {
    rx_bytes: number;
    tx_bytes: number;
  }>;
  pids_stats?: {
    current?: number;
  };
}

async function getContainerStats(id: string): Promise<DockerStats | null> {
  try {
    const raw = await dockerSocketRequest(
      'GET',
      `/v1.47/containers/${id}/stats?stream=false`,
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── CPU percent calculation ────────────────────────────────────────────

function calcCpuPercent(stats: DockerStats): number {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    (stats.precpu_stats.cpu_usage.total_usage || 0);
  const systemDelta =
    stats.cpu_stats.system_cpu_usage -
    (stats.precpu_stats.system_cpu_usage || 0);
  const onlineCpus = stats.cpu_stats.online_cpus || 1;

  if (systemDelta > 0 && cpuDelta > 0) {
    return (cpuDelta / systemDelta) * onlineCpus * 100;
  }
  return 0;
}

// ─── Main collector ─────────────────────────────────────────────────────

export async function collectDockerStats(): Promise<DockerContainerStats[]> {
  const results: DockerContainerStats[] = [];

  try {
    const containers = await listContainers();
    if (containers.length === 0) return [];

    for (const c of containers) {
      try {
        const stats = await getContainerStats(c.Id);
        if (!stats) continue;

        const memUsageMb = (stats.memory_stats.usage || 0) / (1024 * 1024);
        const memLimitMb = (stats.memory_stats.limit || 1) / (1024 * 1024);
        const memPercent = memLimitMb > 0
          ? (memUsageMb / memLimitMb) * 100
          : 0;

        let netInputMb = 0;
        let netOutputMb = 0;
        if (stats.networks) {
          for (const iface of Object.values(stats.networks)) {
            netInputMb += (iface.rx_bytes || 0) / (1024 * 1024);
            netOutputMb += (iface.tx_bytes || 0) / (1024 * 1024);
          }
        }

        // Parse uptime from container status string
        const name = (c.Names?.[0] || c.Id).replace(/^\//, '');

        results.push({
          id: c.Id.substring(0, 12),
          name: name.substring(0, 48),
          image: c.Image,
          status: c.Status,
          state: c.State,
          cpuPercent: Math.round(calcCpuPercent(stats) * 100) / 100,
          memoryUsageMb: Math.round(memUsageMb * 100) / 100,
          memoryLimitMb: Math.round(memLimitMb * 100) / 100,
          memoryPercent: Math.round(memPercent * 100) / 100,
          netInputMb: Math.round(netInputMb * 100) / 100,
          netOutputMb: Math.round(netOutputMb * 100) / 100,
          pids: stats.pids_stats?.current ?? 0,
          uptimeMs: Date.now() - (c.Created * 1000),
        });
      } catch {
        continue;
      }
    }
  } catch {
    // Docker daemon not reachable
  }

  return results;
}
