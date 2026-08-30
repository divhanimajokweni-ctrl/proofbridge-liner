/**
 * server/agent/orchestrator.ts
 *
 * Multi-agent conversational orchestrator.
 * Parses natural language intents into actionable system commands.
 * Connects to telemetry WebSocket (:3001) and service health endpoints.
 */
import WebSocket from 'ws';
import * as http from 'node:http';
import * as crypto from 'node:crypto';

// ─── Types ──────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  intent?: string;
}

export interface ServiceHealth {
  name: string;
  port: number;
  status: 'ONLINE' | 'DEGRADED' | 'UNREACHABLE';
  latencyMs: number;
}

// ─── Agent Orchestrator ─────────────────────────────────────────────────

class VVUAgentOrchestrator {
  private telemetrySocket: WebSocket | null = null;
  private latestMetrics: any = null;
  private conversationHistory: AgentMessage[] = [];

  private services = {
    safeKrypte: { url: 'http://localhost:5096', name: 'SafeKrypte', port: 5096 },
    safeLiner: { url: 'http://localhost:5097', name: 'SafeLiner', port: 5097 },
    operatus: { url: 'http://localhost:4096', name: 'Operatus', port: 4096 },
    telemetry: { url: 'http://localhost:3001', name: 'Telemetry', port: 3001 },
    hmac: { url: 'http://localhost:3099', name: 'HMAC Service', port: 3099 },
  };

  constructor() {
    this.connectTelemetry();
  }

  // ─── Telemetry Connection ───────────────────────────────────────

  private connectTelemetry() {
    try {
      this.telemetrySocket = new WebSocket('ws://localhost:3001');

      this.telemetrySocket.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'telemetry:pulse') {
            this.latestMetrics = parsed.data;
          }
        } catch { /* ignore parse errors */ }
      });

      this.telemetrySocket.on('close', () => {
        setTimeout(() => this.connectTelemetry(), 5000);
      });

      this.telemetrySocket.on('error', () => {
        this.telemetrySocket?.close();
      });
    } catch {
      setTimeout(() => this.connectTelemetry(), 10000);
    }
  }

  // ─── HTTP Helper ────────────────────────────────────────────────

  private async httpGet(url: string, timeoutMs = 3000): Promise<{ ok: boolean; status: number; data: any }> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve({ ok: false, status: 0, data: null }), timeoutMs);
      try {
        const req = http.get(url, { timeout: timeoutMs }, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            clearTimeout(timer);
            try {
              resolve({ ok: true, status: res.statusCode || 0, data: JSON.parse(body) });
            } catch {
              resolve({ ok: true, status: res.statusCode || 0, data: body });
            }
          });
        });
        req.on('error', () => {
          clearTimeout(timer);
          resolve({ ok: false, status: 0, data: null });
        });
        req.on('timeout', () => {
          req.destroy();
          clearTimeout(timer);
          resolve({ ok: false, status: 0, data: null });
        });
      } catch {
        clearTimeout(timer);
        resolve({ ok: false, status: 0, data: null });
      }
    });
  }

  // ─── Intent Parser ──────────────────────────────────────────────

  async processIntent(userInput: string): Promise<string> {
    const input = userInput.toLowerCase().trim();
    const startTime = Date.now();

    // Record in conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    });

    let response: string;

    // ── Service Health ────────────────────────────────────────
    if (input.includes('status') || input.includes('health') || input === 'check services' || input === 'service check') {
      response = await this.checkServiceHealth();
    }
    // ── Telemetry ────────────────────────────────────────────
    else if (input.includes('telemetry') || input.includes('metrics') || input.includes('cpu') || input.includes('memory') || input.includes('system')) {
      response = this.getTelemetryReport();
    }
    // ── Process Kill ──────────────────────────────────────────
    else if (input.includes('kill process') || input.includes('kill pid') || input.includes('stop pid')) {
      const pidMatch = input.match(/\d+/);
      response = pidMatch
        ? await this.killProcess(parseInt(pidMatch[0]))
        : 'Provide a PID to kill. Example: "kill process 1234"';
    }
    // ── SafeKrypte Operations ─────────────────────────────────
    else if (input.includes('sign') || input.includes('encrypt') || input.includes('crypt')) {
      response = await this.cryptoOperation(input);
    }
    // ── SafeLiner Operations ──────────────────────────────────
    else if (input.includes('credential') || input.includes('issue') || input.includes('verify')) {
      response = await this.credentialOperation(input);
    }
    // ── Onboarding ────────────────────────────────────────────
    else if (input.includes('register') || input.includes('create account') || input.includes('new user') || input.includes('onboard')) {
      response = this.getOnboardingInfo();
    }
    // ── Tenant Stats ──────────────────────────────────────────
    else if (input.includes('tenants') || input.includes('users') || input.includes('registrations')) {
      response = this.getTenantStats();
    }
    // ── Help ──────────────────────────────────────────────────
    else if (input.includes('help') || input === '?' || input === 'commands') {
      response = this.getHelpText();
    }
    // ── Greeting ──────────────────────────────────────────────
    else if (input.includes('hello') || input.includes('hi') || input.startsWith('hey')) {
      response = this.getGreeting();
    }
    // ── Unrecognized ──────────────────────────────────────────
    else {
      response = `Intent not recognized: "${userInput}"\nType "help" for available commands.`;
    }

    // Record response
    this.conversationHistory.push({
      role: 'agent',
      content: response,
      timestamp: Date.now(),
      intent: input.split(' ')[0],
    });

    const elapsed = Date.now() - startTime;
    return `[${elapsed}ms] ${response}`;
  }

  // ─── Service Health Check ──────────────────────────────────────

  private async checkServiceHealth(): Promise<string> {
    const results: ServiceHealth[] = [];

    for (const [key, svc] of Object.entries(this.services)) {
      const start = Date.now();
      const result = await this.httpGet(`${svc.url}/health`);
      const latency = Date.now() - start;

      results.push({
        name: svc.name,
        port: svc.port,
        status: result.ok && result.status === 200 ? 'ONLINE' : result.ok ? 'DEGRADED' : 'UNREACHABLE',
        latencyMs: latency,
      });
    }

    const lines = ['═══ SERVICE HEALTH MANIFEST ═══', ''];
    for (const r of results) {
      const icon = r.status === 'ONLINE' ? '✔' : r.status === 'DEGRADED' ? '⚠' : '✘';
      const color = r.status === 'ONLINE' ? 'green' : r.status === 'DEGRADED' ? 'yellow' : 'red';
      lines.push(`  ${icon} ${r.name.padEnd(16)} [:${r.port}]  ${r.status.padEnd(12)} ${r.latencyMs}ms`);
    }

    const onlineCount = results.filter(r => r.status === 'ONLINE').length;
    lines.push('');
    lines.push(`  ${onlineCount}/${results.length} services online`);

    return lines.join('\n');
  }

  // ─── Telemetry Report ──────────────────────────────────────────

  private getTelemetryReport(): string {
    if (!this.latestMetrics) {
      return 'No telemetry data available. Ensure the telemetry server is running on port 3001.';
    }

    const m = this.latestMetrics;
    const cpu = m.cpu?.totalPercent ?? 0;
    const mem = m.memory?.usedPercent ?? 0;
    const load = m.load?.load1 ?? 0;
    const procs = m.processes?.length ?? 0;
    const docker = m.docker?.length ?? 0;

    const lines = [
      '═══ LIVE SYSTEM TELEMETRY ═══',
      '',
      `  CPU Usage:    ${cpu.toFixed(1)}%  ${cpu > 80 ? '🔴 CRITICAL' : cpu > 60 ? '🟡 HIGH' : '🟢 NORMAL'}`,
      `  Memory:       ${mem.toFixed(1)}%  ${mem > 80 ? '🔴 CRITICAL' : mem > 60 ? '🟡 HIGH' : '🟢 NORMAL'}`,
      `  Load Avg:     ${load.toFixed(2)}`,
      `  Processes:    ${procs}`,
      `  Docker:       ${docker} containers`,
      '',
      `  Timestamp:    ${new Date(m.timestamp).toISOString()}`,
    ];

    return lines.join('\n');
  }

  // ─── Kill Process ──────────────────────────────────────────────

  private async killProcess(pid: number): Promise<string> {
    try {
      const result = await this.httpGet(`http://localhost:4096/api/execute?cmd=kill&pid=${pid}`);
      if (result.ok) {
        return `Process ${pid} terminated successfully.`;
      }
      return `Failed to terminate process ${pid}. The PID may not exist or is protected.`;
    } catch {
      return `Error communicating with execution engine for PID ${pid}.`;
    }
  }

  // ─── Crypto Operations ─────────────────────────────────────────

  private async cryptoOperation(input: string): Promise<string> {
    const result = await this.httpGet('http://localhost:5096/health');
    if (!result.ok) {
      return 'SafeKrypte service is unreachable. Ensure it is running on port 5096.';
    }

    return [
      '═══ SAFEKRIPTE OPERATIONS ═══',
      '',
      '  Available operations:',
      '  • POST /commons/v1/sign — Sign content with ED25519',
      '  • POST /commons/v1/keygen — Generate key pair for email',
      '  • GET  /commons/v1/pubkey?email= — Retrieve public key',
      '  • POST /commons/v1/emailsign — Sign email content',
      '',
      `  Service Status: ONLINE (${result.data?.algorithm || 'ED25519'})`,
      `  Creators: ${result.data?.creators || 0} / ${result.data?.tierMax || 1000}`,
    ].join('\n');
  }

  // ─── Credential Operations ─────────────────────────────────────

  private async credentialOperation(input: string): Promise<string> {
    const result = await this.httpGet('http://localhost:5097/health');
    if (!result.ok) {
      return 'SafeLiner service is unreachable. Ensure it is running on port 5097.';
    }

    return [
      '═══ SAFELINER OPERATIONS ═══',
      '',
      '  Available operations:',
      '  • POST /commons/v1/issue — Issue verifiable credential',
      '  • POST /commons/v1/email-credential — Issue email identity credential',
      `  • GET  /commons/v1/credential/:id — Verify credential`,
      '',
      `  Service Status: ONLINE`,
      `  Credentials Issued: ${result.data?.credentials || 0} / ${result.data?.tierMax || 1000}`,
    ].join('\n');
  }

  // ─── Onboarding Info ───────────────────────────────────────────

  private getOnboardingInfo(): string {
    return [
      '═══ VVU ONBOARDING ═══',
      '',
      '  Account creation provisions:',
      '  • War Room access (free)',
      '  • Custom @vvu.on.za email domain',
      '  • First 1000 users: SafeLiner + SafeKrypte FREE',
      '',
      '  Tiers:',
      '  • FREE_FIRST_1K — Full security suite + 5GB storage',
      '  • FREE_STANDARD — War Room + email only + 1GB storage',
      '  • COMMERCIAL_PRO — SafeGrid Edge + 100GB storage',
      '  • INDUSTRY_MONOLITH — Everything + 1TB + full mesh',
      '',
      '  Create account: POST /api/gateway/onboard',
    ].join('\n');
  }

  // ─── Tenant Stats ──────────────────────────────────────────────

  private getTenantStats(): string {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data', 'gateway');
      const seqFile = path.join(dataDir, 'user-sequence.dat');

      let count = 0;
      try { count = parseInt(fs.readFileSync(seqFile, 'utf-8'), 10) || 0; } catch {}

      const free1kRemaining = Math.max(0, 1000 - count);

      return [
        '═══ TENANT REGISTRY ═══',
        '',
        `  Total Registered:   ${count}`,
        `  Free Tier Remaining: ${free1kRemaining}`,
        `  Free Tier Exhausted: ${free1kRemaining === 0 ? 'YES' : 'NO'}`,
        '',
        '  Breakdown:',
        `    FREE_FIRST_1K:     ${Math.min(count, 1000)}`,
        `    FREE_STANDARD:     ${Math.max(0, count - 1000)}`,
      ].join('\n');
    } catch {
      return 'Unable to read tenant registry.';
    }
  }

  // ─── Help ──────────────────────────────────────────────────────

  private getHelpText(): string {
    return [
      '═══ VVU AGENT COMMANDS ═══',
      '',
      '  SYSTEM:',
      '    status / health     — Check all service health',
      '    telemetry / metrics — Live CPU, memory, load',
      '    kill process <PID>  — Terminate a process',
      '',
      '  SECURITY:',
      '    sign / encrypt      — SafeKrypte operations',
      '    credential / issue  — SafeLiner operations',
      '',
      '  PLATFORM:',
      '    register / onboard  — Account creation info',
      '    tenants / users     — Registration statistics',
      '',
      '  OTHER:',
      '    help / commands     — Show this help text',
      '    hello / hi          — Greeting',
    ].join('\n');
  }

  // ─── Greeting ──────────────────────────────────────────────────

  private getGreeting(): string {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return [
      `${timeGreeting}. Welcome to the VVU Agent Kernel.`,
      '',
      'I am your operational assistant. I can:',
      '  • Check service health and live telemetry',
      '  • Execute system commands via Operatus',
      '  • Manage SafeKrypte and SafeLiner operations',
      '  • Handle account onboarding and provisioning',
      '',
      'Type "help" for available commands.',
    ].join('\n');
  }

  // ─── History ───────────────────────────────────────────────────

  getHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// Singleton export
const orchestrator = new VVUAgentOrchestrator();
export default orchestrator;
export { VVUAgentOrchestrator };
