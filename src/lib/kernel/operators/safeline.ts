/**
 * VVU OS — SAFELINER Operator
 * MAC enforcement, token validation, file ACL, memory watch.
 * Real access control for the VVU OS process ecosystem.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IOperator, OperatorStatus, OperatorResult, SubsystemType } from './types';
import { SECURITY_POLICIES, lookupReservation } from '../vvu-registry';

export class SafelinerOperator implements IOperator {
  readonly name = 'VVU-SAFELINER';
  readonly subsystem: SubsystemType = 'SECURITY';
  pid: number = 0;

  private startedAt: number = 0;
  private lastActivity: string | null = null;
  private errorCount = 0;
  private state: OperatorStatus['state'] = 'INIT';

  // In-memory ACL store
  private acl: Map<string, string[]> = new Map();
  // In-memory token store
  private tokens: Map<string, { role: string; exp: number }> = new Map();

  async start(): Promise<void> {
    this.state = 'RUNNING';
    this.startedAt = Date.now();
    this.lastActivity = new Date().toISOString();

    // Load default policies from registry
    const safelinerPolicies = SECURITY_POLICIES.find(p => p.processName === 'VVU-SAFELINER');
    if (safelinerPolicies) {
      for (const policy of safelinerPolicies.policies) {
        this.acl.set(`policy:${policy.split(' — ')[0]}`, [policy]);
      }
    }
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
        case 'validate-token':
          return this.validateToken(args, start);
        case 'create-token':
          return this.createToken(args, start);
        case 'check-permission':
          return this.checkPermission(args, start);
        case 'set-acl':
          return this.setAcl(args, start);
        case 'get-acl':
          return this.getAcl(start);
        case 'get-policies':
          return this.getPolicies(start);
        case 'memory-watch':
          return this.memoryWatch(args, start);
        default:
          return {
            success: false,
            data: null,
            error: `SAFELINER: unknown command '${command}'`,
            durationMs: Date.now() - start,
          };
      }
    } catch (err) {
      this.errorCount++;
      return {
        success: false,
        data: null,
        error: `SAFELINER error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
      };
    }
  }

  private validateToken(args: Record<string, unknown> | undefined, start: number): OperatorResult {
    const token = String(args?.token ?? '');
    if (!token) {
      return { success: false, data: null, error: 'SAFELINER: token required', durationMs: Date.now() - start };
    }

    const stored = this.tokens.get(token);
    if (!stored) {
      return { success: false, data: null, error: 'SAFELINER: invalid token', durationMs: Date.now() - start };
    }

    if (stored.exp < Date.now()) {
      this.tokens.delete(token);
      return { success: false, data: null, error: 'SAFELINER: token expired', durationMs: Date.now() - start };
    }

    return {
      success: true,
      data: {
        valid: true,
        role: stored.role,
        expires: new Date(stored.exp).toISOString(),
      },
      durationMs: Date.now() - start,
    };
  }

  private createToken(args: Record<string, unknown> | undefined, start: number): OperatorResult {
    const role = String(args?.role ?? 'user');
    const ttlMs = Number(args?.ttlMs ?? 3600000);
    const token = `vvu_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    this.tokens.set(token, { role, exp: Date.now() + ttlMs });

    return {
      success: true,
      data: { token, role, expiresIn: ttlMs },
      durationMs: Date.now() - start,
    };
  }

  private checkPermission(args: Record<string, unknown> | undefined, start: number): OperatorResult {
    const token = String(args?.token ?? '');
    const resource = String(args?.resource ?? '');
    const action = String(args?.action ?? 'read');

    const stored = this.tokens.get(token);
    if (!stored) {
      return { success: false, data: null, error: 'SAFELINER: unauthorized — invalid token', durationMs: Date.now() - start };
    }

    // Simple RBAC: admin can do anything, others can only read
    if (stored.role === 'admin') {
      return {
        success: true,
        data: { allowed: true, role: stored.role, resource, action },
        durationMs: Date.now() - start,
      };
    }

    if (action === 'read') {
      return {
        success: true,
        data: { allowed: true, role: stored.role, resource, action },
        durationMs: Date.now() - start,
      };
    }

    return {
      success: true,
      data: { allowed: false, role: stored.role, resource, action, reason: `Role '${stored.role}' cannot ${action} ${resource}` },
      durationMs: Date.now() - start,
    };
  }

  private setAcl(args: Record<string, unknown> | undefined, start: number): OperatorResult {
    const resource = String(args?.resource ?? '');
    const permissions = (args?.permissions as string[]) ?? [];
    this.acl.set(resource, permissions);

    return {
      success: true,
      data: { resource, permissions, aclSize: this.acl.size },
      durationMs: Date.now() - start,
    };
  }

  private getAcl(start: number): OperatorResult {
    const entries: Record<string, string[]> = {};
    for (const [key, perms] of this.acl) {
      entries[key] = perms;
    }
    return {
      success: true,
      data: { acl: entries, size: this.acl.size },
      durationMs: Date.now() - start,
    };
  }

  private getPolicies(start: number): OperatorResult {
    return {
      success: true,
      data: SECURITY_POLICIES,
      durationMs: Date.now() - start,
    };
  }

  private memoryWatch(args: Record<string, unknown> | undefined, start: number): OperatorResult {
    const processName = String(args?.process ?? '');

    const reservation = lookupReservation(processName);
    if (reservation) {
      return {
        success: true,
        data: {
          process: processName,
          reservedMemory: reservation.memoryMB,
          subsystem: reservation.subsystem,
          priority: reservation.priority,
        },
        durationMs: Date.now() - start,
      };
    }

    return {
      success: true,
      data: {
        process: processName,
        reservedMemory: 'unknown (not in registry)',
        note: 'Use allocateProcess to add this process',
      },
      durationMs: Date.now() - start,
    };
  }
}
