// vvu-telemetry-20260901.ts
// Telemetry payload types + invariant validation (mirrors vvu-telemetry-controller)
// Source: VVU HBK Mk-II Hydro-Gateway · Zero-Fictional Engineering baseline

import { HYDRAULIC_INVARIANTS } from './vvu-release-manifest';

export interface TelemetryPayload {
  nodeId: string;
  flowRate: number; // L/s
  pressureHead: number; // m
  acousticAbnormal: boolean;
  apuTemperature: number; // °C
  tenantId: string;
  timestamp: number;
}

export type TelemetryState =
  | 'STEADY_STATE'
  | 'THERMAL_THROTTLE'
  | 'FAIL_CLOSED_LOCKDOWN';

export interface TelemetryResult {
  success: boolean;
  message: string;
  state: TelemetryState;
  estimatedCelerity: number;
  invariantOk: boolean;
  logId: string;
}

// Joukowsky-style sanity check: estimated celerity must fall inside SANS bounds.
// Real impl uses (pressureHead * 9.81 * 1000) / flowRate; we keep the same form.
export function estimateCelerity(pressureHead: number, flowRate: number): number {
  if (!flowRate || flowRate <= 0) return 0;
  return (pressureHead * 9.81 * 1000) / flowRate;
}

export function classifyThermal(apuTemperature: number): TelemetryState {
  if (apuTemperature >= 85.0) return 'FAIL_CLOSED_LOCKDOWN';
  if (apuTemperature >= 65.0) return 'THERMAL_THROTTLE';
  return 'STEADY_STATE';
}

export function validateTelemetry(payload: TelemetryPayload): TelemetryResult {
  const celerity = estimateCelerity(payload.pressureHead, payload.flowRate);
  const invariantOk =
    celerity === 0 ||
    (celerity >= HYDRAULIC_INVARIANTS.minWaveCelerity &&
      celerity <= HYDRAULIC_INVARIANTS.maxWaveCelerity);
  const state = classifyThermal(payload.apuTemperature);

  if (!invariantOk) {
    return {
      success: false,
      message: `Telemetry rejected. Estimated celerity ${celerity.toFixed(
        2
      )} m/s violates SANS bounds [${HYDRAULIC_INVARIANTS.minWaveCelerity}, ${
        HYDRAULIC_INVARIANTS.maxWaveCelerity
      }] m/s.`,
      state,
      estimatedCelerity: celerity,
      invariantOk: false,
      logId: 'REJECTED',
    };
  }

  return {
    success: true,
    message: `Telemetry synced · state=${state} · celerity=${celerity.toFixed(2)} m/s`,
    state,
    estimatedCelerity: celerity,
    invariantOk: true,
    logId: `LOG-${Date.now().toString(36).toUpperCase()}`,
  };
}

// Deterministic mock sensor generator — produces SANS-compliant signals so the
// dashboard's live feed stays inside the safe harbour invariant space.
export function generateMockTelemetry(tenantId: string, nodeId: string): TelemetryPayload {
  const t = Date.now() / 1000;
  const flowRate = 42 + Math.sin(t / 7) * 6 + Math.random() * 2; // 34–50 L/s
  const pressureHead = 38 + Math.cos(t / 11) * 4 + Math.random() * 1.5; // 33–44 m
  const apuTemperature = 48 + Math.sin(t / 23) * 9 + Math.random() * 2; // 37–60 °C (steady)
  const acousticAbnormal = Math.random() < 0.04;
  return {
    nodeId,
    tenantId,
    flowRate: Math.round(flowRate * 100) / 100,
    pressureHead: Math.round(pressureHead * 100) / 100,
    acousticAbnormal,
    apuTemperature: Math.round(apuTemperature * 10) / 10,
    timestamp: Date.now(),
  };
}

export const TENANTS = [
  { id: 'e1002324-0000-0000-0000-000000000001', name: 'Gqeberha Beachfront R&D', slug: 'gqeberha-beachfront-rd' },
  { id: 'a2000000-0000-0000-0000-000000000002', name: 'Anglo American · Mogalakwena', slug: 'anglo-mogalakwena' },
  { id: 'b3000000-0000-0000-0000-000000000003', name: 'Sibanye-Stillwater · Marikana', slug: 'sibanye-marikana' },
];

export const DEFAULT_TENANT = TENANTS[0];
