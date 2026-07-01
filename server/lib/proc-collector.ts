/**
 * proc-collector.ts
 *
 * Reads system telemetry directly from /proc filesystem.
 * Designed for Linux containers with standard /proc access.
 *
 * CPU: reads /proc/stat for delta-based CPU percentages
 * Memory: reads /proc/meminfo
 * Load: reads /proc/loadavg
 * Processes: reads /proc/[pid]/stat + /proc/[pid]/status
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CpuSnapshot, MemorySnapshot, LoadSnapshot, ProcessRecord } from './telemetry-types';

// ─── Helpers ────────────────────────────────────────────────────────────

const PROC = '/proc';

function readFileLines(p: string): string[] {
  try {
    const content = fs.readFileSync(p, 'utf-8');
    return content.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function readFileText(p: string): string {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return '';
  }
}

// ─── CPU via /proc/stat ─────────────────────────────────────────────────

/** Previous tick's CPU values for delta calculation */
let prevCpuTimes: number[] | null = null;
let prevCpuTotal = 0;

export function readCpuWithDelta(): CpuSnapshot | null {
  const lines = readFileLines(path.join(PROC, 'stat'));
  const cpuLine = lines.find(l => l.startsWith('cpu '));
  if (!cpuLine) return null;

  const parts = cpuLine.trim().split(/\s+/).slice(1).map(Number);
  if (parts.length < 8) return null;

  const [user, nice, system, idle, iowait, irq, softirq, steal] = parts;
  const total = parts.reduce((a, b) => a + b, 0);

  const snapshot: CpuSnapshot = {
    user: parts[0],
    nice: parts[1],
    system: parts[2],
    idle: parts[3],
    iowait: parts[4] || 0,
    irq: parts[5] || 0,
    softirq: parts[6] || 0,
    steal: parts[7] || 0,
    totalPercent: 0, // computed below
  };

  if (prevCpuTimes && prevCpuTotal > 0) {
    const deltaTotal = total - prevCpuTotal;
    const deltaIdle = idle - prevCpuTimes[3];
    snapshot.totalPercent = deltaTotal > 0
      ? ((deltaTotal - deltaIdle) / deltaTotal) * 100
      : 0;
  } else {
    snapshot.totalPercent = 100 - idle; // first tick: static
  }

  prevCpuTimes = parts;
  prevCpuTotal = total;

  return snapshot;
}

// ─── Memory via /proc/meminfo ──────────────────────────────────────────

export function readMemory(): MemorySnapshot | null {
  const lines = readFileLines(path.join(PROC, 'meminfo'));
  if (lines.length === 0) return null;

  const getValue = (key: string): number => {
    const line = lines.find(l => l.startsWith(key + ':'));
    if (!line) return 0;
    const match = line.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const totalKb = getValue('MemTotal');
  const freeKb = getValue('MemFree');
  const availableKb = getValue('MemAvailable') || (totalKb - getValue('MemFree') - getValue('Cached') - getValue('Buffers'));
  const buffersKb = getValue('Buffers');
  const cachedKb = getValue('Cached');

  return {
    totalKb,
    freeKb,
    availableKb,
    buffersKb,
    cachedKb,
    usedPercent: totalKb > 0 ? ((totalKb - availableKb) / totalKb) * 100 : 0,
  };
}

// ─── Load via /proc/loadavg ────────────────────────────────────────────

export function readLoad(): LoadSnapshot | null {
  const text = readFileText(path.join(PROC, 'loadavg'));
  if (!text) return null;

  const parts = text.trim().split(/\s+/);
  if (parts.length < 4) return null;

  const [load1, load5, load15] = parts.map(Number);
  const runningTotal = parts[3]?.split('/') || ['0', '1'];

  return {
    load1,
    load5,
    load15,
    running: Number(runningTotal[0]) || 0,
    total: Number(runningTotal[1]) || 1,
  };
}

// ─── Processes via /proc/[pid] ─────────────────────────────────────────

interface ProcStatFields {
  pid: number;
  comm: string;
  state: string;
  utime: number;
  stime: number;
  cutime: number;
  cstime: number;
  rss: number;
}

function parseProcStat(statLine: string): ProcStatFields | null {
  // Format: pid (comm) state ppid ... 
  // The comm field can contain parentheses, so we find the last ') '
  const closeParen = statLine.lastIndexOf(') ');
  if (closeParen === -1) return null;

  const pidStr = statLine.substring(0, statLine.indexOf('(')).trim();
  const afterComm = statLine.substring(closeParen + 2).trim().split(/\s+/);

  return {
    pid: Number(pidStr) || 0,
    comm: statLine.substring(statLine.indexOf('(') + 1, closeParen),
    state: afterComm[0] || '?',
    utime: Number(afterComm[11]) || 0,  // field index 13 (0-based: 11)
    stime: Number(afterComm[12]) || 0,
    cutime: Number(afterComm[13]) || 0,
    cstime: Number(afterComm[14]) || 0,
    rss: Number(afterComm[22]) || 0,    // field index 24 (0-based: 22)
  };
}

function getStatusField(lines: string[], key: string): string {
  const line = lines.find(l => l.startsWith(key + ':'));
  if (!line) return '';
  return line.substring(key.length + 1).trim();
}

export function readProcesses(maxPids = 500): ProcessRecord[] {
  const results: ProcessRecord[] = [];

  let pidDir: string[];
  try {
    pidDir = fs.readdirSync(PROC).filter(
      entry => /^\d+$/.test(entry) && results.length < maxPids,
    );
  } catch {
    return [];
  }

  // Get total memory for percent calculation
  const mem = readMemory();
  const totalMemKb = mem?.totalKb || 1;

  let uptimeSec = 0;
  try {
    const uptimeStr = readFileText(path.join(PROC, 'uptime'));
    uptimeSec = Number(uptimeStr.split(' ')[0]) || 0;
  } catch { /* ignore */ }

  for (const entry of pidDir) {
    if (results.length >= maxPids) break;

    try {
      const statRaw = readFileText(path.join(PROC, entry, 'stat'));
      if (!statRaw) continue;

      const parsed = parseProcStat(statRaw);
      if (!parsed) continue;

      // Read /proc/[pid]/status for name + user info
      const statusLines = readFileLines(path.join(PROC, entry, 'status'));
      const name = getStatusField(statusLines, 'Name');
      const uid = getStatusField(statusLines, 'Uid');

      // Read /proc/[pid]/cmdline
      let cmd = '';
      try {
        cmd = readFileText(path.join(PROC, entry, 'cmdline')).replace(/\0/g, ' ').trim();
      } catch { /* ignore */ }

      // CPU: (utime + stime) / uptime_delta * 100 / HERZ
      const totalJiffies = parsed.utime + parsed.stime;
      // Approximate: convert jiffies to percent using uptime
      // CLK_TCK is typically 100 on Linux
      const hertz = 100;
      const cpuPercent = uptimeSec > 0
        ? (totalJiffies / hertz / uptimeSec) * 100
        : 0;

      // Memory RSS in KB (rss is in pages, page size = 4KB on most)
      const rssKb = parsed.rss * 4;
      const memPercent = (rssKb / totalMemKb) * 100;

      results.push({
        pid: parsed.pid,
        name: name || parsed.comm,
        state: parsed.state,
        cpuPercent: Math.round(cpuPercent * 100) / 100,
        memoryPercent: Math.round(memPercent * 100) / 100,
        memoryRssKb: rssKb,
        user: uid,
        command: cmd || parsed.comm,
      });
    } catch {
      // Process may have exited between readdir and stat
      continue;
    }
  }

  // Sort by PID ascending
  results.sort((a, b) => a.pid - b.pid);
  return results;
}
