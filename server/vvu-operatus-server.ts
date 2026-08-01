/**
 * VVU Operatus — Headless Server
 *
 * Standalone HTTP server booting the VVU Operatus microkernel
 * with SafeLiner (MAC enforcement) and SafeKrypte (key management).
 *
 * Usage:
 *   npx tsx server/vvu-operatus-server.ts
 *   PORT=4096 npx tsx server/vvu-operatus-server.ts
 */

import http from 'node:http';
import { Operatus } from '../src/lib/kernel/vvu-operatus';

const PORT = Number(process.env.PORT ?? 4096);
const HOST = process.env.HOST ?? '127.0.0.1';

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const method = req.method ?? 'GET';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const result = await routeRequest(method, url);
    res.writeHead(result.status);
    res.end(JSON.stringify(result.body));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    }));
  }
}

async function routeRequest(method: string, url: URL): Promise<{ status: number; body: unknown }> {
  const path = url.pathname;

  // GET /health
  if (path === '/health' && method === 'GET') {
    return {
      status: 200,
      body: { status: 'healthy', service: 'vvu-operatus', uptime: process.uptime() },
    };
  }

  // GET /status — full system status
  if (path === '/status' && method === 'GET') {
    const status = Operatus.getStatus();
    return { status: 200, body: { success: true, data: status } };
  }

  // POST /execute — run a command against any operator
  if (path === '/execute' && method === 'POST') {
    const body = await readBody(url);
    if (!body || !body.target || !body.command) {
      return { status: 400, body: { success: false, error: 'Missing required fields: target, command' } };
    }
    const result = await Operatus.execute({ target: body.target as string, command: body.command as string, args: body.args as Record<string, unknown> | undefined });
    return { status: 200, body: { success: result.success, data: result } };
  }

  // GET /operators — list all operators
  if (path === '/operators' && method === 'GET') {
    const ops = Operatus.getStatus().operators;
    return { status: 200, body: { success: true, data: ops } };
  }

  // GET /safeliner/status — SafeLiner-specific status
  if (path === '/safeliner/status' && method === 'GET') {
    const safeliner = Operatus.getOperator('VVU-SAFELINER');
    if (!safeliner) return { status: 404, body: { success: false, error: 'SafeLiner not available' } };
    const policies = await safeliner.execute('get-policies');
    const acl = await safeliner.execute('get-acl');
    return { status: 200, body: { success: true, data: { status: safeliner.status(), policies: policies.data, acl: acl.data } } };
  }

  // POST /safeliner/validate-token
  if (path === '/safeliner/validate-token' && method === 'POST') {
    const body = await readBody(url);
    const safeliner = Operatus.getOperator('VVU-SAFELINER');
    if (!safeliner) return { status: 404, body: { success: false, error: 'SafeLiner not available' } };
    const result = await safeliner.execute('validate-token', { token: body?.token });
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // POST /safeliner/check-permission
  if (path === '/safeliner/check-permission' && method === 'POST') {
    const body = await readBody(url);
    const safeliner = Operatus.getOperator('VVU-SAFELINER');
    if (!safeliner) return { status: 404, body: { success: false, error: 'SafeLiner not available' } };
    const result = await safeliner.execute('check-permission', { token: body?.token, resource: body?.resource, action: body?.action });
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // POST /safeliner/create-token
  if (path === '/safeliner/create-token' && method === 'POST') {
    const body = await readBody(url);
    const safeliner = Operatus.getOperator('VVU-SAFELINER');
    if (!safeliner) return { status: 404, body: { success: false, error: 'SafeLiner not available' } };
    const result = await safeliner.execute('create-token', { role: body?.role, ttlMs: body?.ttlMs });
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // GET /safekrypte/status — SafeKrypte-specific status
  if (path === '/safekrypte/status' && method === 'GET') {
    const safekrypte = Operatus.getOperator('VVU-SAFEKRIPTE');
    if (!safekrypte) return { status: 404, body: { success: false, error: 'SafeKrypte not available' } };
    const escrow = await safekrypte.execute('escrow-status');
    const hsm = await safekrypte.execute('hsm-status');
    const keys = await safekrypte.execute('list-keys');
    return { status: 200, body: { success: true, data: { status: safekrypte.status(), escrow: escrow.data, hsm: hsm.data, keys: keys.data } } };
  }

  // POST /safekrypte/generate-keypair
  if (path === '/safekrypte/generate-keypair' && method === 'POST') {
    const safekrypte = Operatus.getOperator('VVU-SAFEKRIPTE');
    if (!safekrypte) return { status: 404, body: { success: false, error: 'SafeKrypte not available' } };
    const result = await safekrypte.execute('generate-keypair');
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // POST /safekrypte/sign
  if (path === '/safekrypte/sign' && method === 'POST') {
    const body = await readBody(url);
    const safekrypte = Operatus.getOperator('VVU-SAFEKRIPTE');
    if (!safekrypte) return { status: 404, body: { success: false, error: 'SafeKrypte not available' } };
    const result = await safekrypte.execute('sign-message', { message: body?.message, keyId: body?.keyId });
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // POST /safekrypte/verify
  if (path === '/safekrypte/verify' && method === 'POST') {
    const body = await readBody(url);
    const safekrypte = Operatus.getOperator('VVU-SAFEKRIPTE');
    if (!safekrypte) return { status: 404, body: { success: false, error: 'SafeKrypte not available' } };
    const result = await safekrypte.execute('verify-signature', { message: body?.message, signature: body?.signature, keyId: body?.keyId });
    return { status: 200, body: { success: result.success, data: result.data, error: result.error } };
  }

  // GET /audit/logs
  if (path === '/audit/logs' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const severity = url.searchParams.get('severity') ?? '';
    const audit = Operatus.getOperator('VVU-AUDIT-BUS');
    if (!audit) return { status: 404, body: { success: false, error: 'Audit bus not available' } };
    const result = await audit.execute('read-log', { limit, severity });
    return { status: 200, body: { success: true, data: result.data } };
  }

  // POST /kernel/panic
  if (path === '/kernel/panic' && method === 'POST') {
    const body = await readBody(url);
    const reason = String(body?.reason ?? 'Manual panic from headless server');
    Operatus.panic(reason);
    return { status: 200, body: { success: true, data: { action: 'PANIC', reason } } };
  }

  // POST /kernel/reboot
  if (path === '/kernel/reboot' && method === 'POST') {
    await Operatus.reboot();
    return { status: 200, body: { success: true, data: { action: 'REBOOT', message: 'Cold-boot reset complete. All operators reinitialized.' } } };
  }

  // POST /kernel/tick
  if (path === '/kernel/tick' && method === 'POST') {
    const logs = Operatus.runSchedulerTick();
    return { status: 200, body: { success: true, data: { logs, cycle: logs.length } } };
  }

  // GET /ping
  if (path === '/ping' && method === 'GET') {
    const result = await Operatus.execute({ target: 'system', command: 'ping' });
    return { status: 200, body: { success: true, data: result } };
  }

  return { status: 404, body: { success: false, error: `Not found: ${method} ${path}` } };
}

async function readBody(url: URL): Promise<Record<string, unknown> | undefined> {
  const searchBody = url.searchParams.get('body');
  if (searchBody) {
    try { return JSON.parse(searchBody); } catch { return undefined; }
  }
  return undefined;
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, async () => {
  await Operatus.init();
  const status = Operatus.getStatus();
  const safeliner = status.operators.find(o => o.name === 'VVU-SAFELINER');
  const safekrypte = status.operators.find(o => o.name === 'VVU-SAFEKRIPTE');
  console.log(JSON.stringify({
    event: 'VU_OPERATUS_SERVER_ONLINE',
    host: HOST,
    port: PORT,
    operators: status.operators.length,
    safeliner: safeliner?.state ?? 'NOT_FOUND',
    safekrypte: safekrypte?.state ?? 'NOT_FOUND',
    endpoints: [
      'GET  /health',
      'GET  /ping',
      'GET  /status',
      'GET  /operators',
      'POST /execute',
      'GET  /safeliner/status',
      'POST /safeliner/validate-token',
      'POST /safeliner/check-permission',
      'POST /safeliner/create-token',
      'GET  /safekrypte/status',
      'POST /safekrypte/generate-keypair',
      'POST /safekrypte/sign',
      'POST /safekrypte/verify',
      'GET  /audit/logs',
      'POST /kernel/tick',
      'POST /kernel/panic',
      'POST /kernel/reboot',
    ],
  }));
});
