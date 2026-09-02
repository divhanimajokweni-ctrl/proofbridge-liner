// vvu-fsm-controller-20260901.ts
// VVU Master Governance Framework v2.1 · Zero-Fabrication Policy
// Deterministic Finite Automaton (DFA) for 3D Node & Edge-Pairing Lifecycle
// Source: VVU HBK Mk-II Hydro-Gateway E2E Engineering Compilation

export enum VVUNodeState {
  DISCONNECTED = 'DISCONNECTED',
  PAIRING_BLE = 'PAIRING_BLE',
  TOTP_VERIFICATION = 'TOTP_VERIFICATION',
  STEADY_STATE_LOCKED = 'STEADY_STATE_LOCKED',
  LEAK_SIMULATION_ACTIVE = 'LEAK_SIMULATION_ACTIVE',
  THERMAL_THROTTLE = 'THERMAL_THROTTLE',
  FAIL_CLOSED_LOCKDOWN = 'FAIL_CLOSED_LOCKDOWN',
}

export type VVUInputSymbol =
  | 'INIT'
  | 'CHAL'
  | 'TOTP_OK'
  | 'FAIL'
  | 'CLICK'
  | 'CLEAR'
  | 'WARN'
  | 'CRIT'
  | 'RESET';

export interface VVUTransitionLogEntry {
  id: string;
  from: VVUNodeState;
  to: VVUNodeState;
  symbol: VVUInputSymbol;
  timestamp: number;
  reason?: string;
}

export type VVUActionMap = {
  onPairingStart?: () => void;
  onTOTPChallenge?: () => void;
  onSteadyStateEnter?: () => void;
  onLeakActivate?: (nodeId: string) => void;
  onLeakClear?: () => void;
  onThermalThrottle?: (temp: number) => void;
  onThrottleDeescalate?: () => void;
  onFailClosed?: (reason: string) => void;
  onResetComplete?: () => void;
  logTransition?: (from: VVUNodeState, to: VVUNodeState, symbol: VVUInputSymbol) => void;
};

const TRANSITION_TABLE: Record<VVUNodeState, Partial<Record<VVUInputSymbol, VVUNodeState>>> = {
  [VVUNodeState.DISCONNECTED]: { INIT: VVUNodeState.PAIRING_BLE },
  [VVUNodeState.PAIRING_BLE]: {
    CHAL: VVUNodeState.TOTP_VERIFICATION,
    FAIL: VVUNodeState.DISCONNECTED,
  },
  [VVUNodeState.TOTP_VERIFICATION]: {
    TOTP_OK: VVUNodeState.STEADY_STATE_LOCKED,
    FAIL: VVUNodeState.DISCONNECTED,
  },
  [VVUNodeState.STEADY_STATE_LOCKED]: {
    CLICK: VVUNodeState.LEAK_SIMULATION_ACTIVE,
    WARN: VVUNodeState.THERMAL_THROTTLE,
    CRIT: VVUNodeState.FAIL_CLOSED_LOCKDOWN,
  },
  [VVUNodeState.LEAK_SIMULATION_ACTIVE]: {
    CLEAR: VVUNodeState.STEADY_STATE_LOCKED,
    WARN: VVUNodeState.THERMAL_THROTTLE,
    CRIT: VVUNodeState.FAIL_CLOSED_LOCKDOWN,
  },
  [VVUNodeState.THERMAL_THROTTLE]: {
    RESET: VVUNodeState.LEAK_SIMULATION_ACTIVE,
    CRIT: VVUNodeState.FAIL_CLOSED_LOCKDOWN,
  },
  [VVUNodeState.FAIL_CLOSED_LOCKDOWN]: {
    RESET: VVUNodeState.STEADY_STATE_LOCKED,
  },
};

export const VVU_STATE_LABELS: Record<VVUNodeState, string> = {
  DISCONNECTED: 'Disconnected',
  PAIRING_BLE: 'BLE Pairing',
  TOTP_VERIFICATION: 'TOTP Verification',
  STEADY_STATE_LOCKED: 'Steady State · Locked',
  LEAK_SIMULATION_ACTIVE: 'Leak Simulation Active',
  THERMAL_THROTTLE: 'Thermal Throttle',
  FAIL_CLOSED_LOCKDOWN: 'FAIL-CLOSED Lockdown',
};

export const VVU_STATE_DESCRIPTIONS: Record<VVUNodeState, string> = {
  DISCONNECTED: 'Node offline — awaiting BLE handshake initialisation.',
  PAIRING_BLE: 'BLE advertising active — FIDO2 challenge in flight.',
  TOTP_VERIFICATION: 'Challenge received — TOTP window open (±30s).',
  STEADY_STATE_LOCKED: 'Pairing complete — telemetry flowing, terrain mesh rendered.',
  LEAK_SIMULATION_ACTIVE: 'Pipe node selected — leak particle system engaged.',
  THERMAL_THROTTLE: 'APU ≥ 65°C — vertex decimation active, mesh density reduced.',
  FAIL_CLOSED_LOCKDOWN: 'APU ≥ 85°C or tamper — hardware disconnect, WORM flush.',
};

export class VVUFSMController {
  private currentState: VVUNodeState = VVUNodeState.DISCONNECTED;
  private actions: VVUActionMap;
  private thermalHysteresis = 5;
  private thermalThresholds = { warn: 65, crit: 85 };
  private lastTemp = 0;
  private log: VVUTransitionLogEntry[] = [];
  private sequence = 0;

  constructor(actions: VVUActionMap = {}) {
    this.actions = actions;
  }

  getState(): VVUNodeState {
    return this.currentState;
  }

  getLog(): VVUTransitionLogEntry[] {
    return [...this.log];
  }

  getLastTemp(): number {
    return this.lastTemp;
  }

  dispatch(symbol: VVUInputSymbol, payload?: { nodeId?: string; reason?: string }): void {
    const from = this.currentState;
    const allowed = TRANSITION_TABLE[from] || {};
    const to = allowed[symbol];

    if (!to) {
      // Illegal transition — ignore silently (deterministic, fail-safe)
      return;
    }

    this.currentState = to;
    const entry: VVUTransitionLogEntry = {
      id: `T-${String(++this.sequence).padStart(4, '0')}`,
      from,
      to,
      symbol,
      timestamp: Date.now(),
      reason: payload?.reason,
    };
    this.log = [entry, ...this.log].slice(0, 50);

    if (this.actions.logTransition) {
      this.actions.logTransition(from, to, symbol);
    }
    this.executeActions(from, to, symbol, payload);

    // Thermal auto-escalation guard
    if (
      (to === VVUNodeState.STEADY_STATE_LOCKED ||
        to === VVUNodeState.LEAK_SIMULATION_ACTIVE) &&
      this.lastTemp >= this.thermalThresholds.warn
    ) {
      this.dispatch('WARN');
    }
  }

  private executeActions(
    from: VVUNodeState,
    to: VVUNodeState,
    symbol: VVUInputSymbol,
    payload?: { nodeId?: string; reason?: string }
  ): void {
    switch (to) {
      case VVUNodeState.PAIRING_BLE:
        this.actions.onPairingStart?.();
        break;
      case VVUNodeState.TOTP_VERIFICATION:
        this.actions.onTOTPChallenge?.();
        break;
      case VVUNodeState.STEADY_STATE_LOCKED:
        if (from === VVUNodeState.FAIL_CLOSED_LOCKDOWN) this.actions.onResetComplete?.();
        else this.actions.onSteadyStateEnter?.();
        break;
      case VVUNodeState.LEAK_SIMULATION_ACTIVE:
        if (symbol === 'CLICK' && payload?.nodeId) {
          this.actions.onLeakActivate?.(payload.nodeId);
        } else if (from === VVUNodeState.THERMAL_THROTTLE && payload?.nodeId) {
          this.actions.onLeakActivate?.(payload.nodeId);
        }
        break;
      case VVUNodeState.THERMAL_THROTTLE:
        this.actions.onThermalThrottle?.(this.lastTemp);
        break;
      case VVUNodeState.FAIL_CLOSED_LOCKDOWN:
        this.actions.onFailClosed?.(symbol === 'CRIT' ? 'Thermal/tamper' : 'Unknown');
        break;
    }

    if (symbol === 'CLEAR' && from === VVUNodeState.LEAK_SIMULATION_ACTIVE) {
      this.actions.onLeakClear?.();
    }
    if (symbol === 'RESET' && from === VVUNodeState.THERMAL_THROTTLE) {
      if (this.lastTemp < this.thermalThresholds.warn - this.thermalHysteresis) {
        this.actions.onThrottleDeescalate?.();
      } else {
        this.currentState = VVUNodeState.THERMAL_THROTTLE; // revert — hysteresis gate
      }
    }
  }

  updateTemperature(tempCelsius: number): void {
    this.lastTemp = tempCelsius;
    if (tempCelsius >= this.thermalThresholds.crit) {
      this.dispatch('CRIT', { reason: `APU temp ${tempCelsius.toFixed(1)}°C ≥ 85°C` });
    } else if (tempCelsius >= this.thermalThresholds.warn) {
      if (
        this.currentState !== VVUNodeState.THERMAL_THROTTLE &&
        this.currentState !== VVUNodeState.FAIL_CLOSED_LOCKDOWN
      ) {
        this.dispatch('WARN', { reason: `APU temp ${tempCelsius.toFixed(1)}°C ≥ 65°C` });
      }
    } else if (
      this.currentState === VVUNodeState.THERMAL_THROTTLE &&
      tempCelsius < this.thermalThresholds.warn - this.thermalHysteresis
    ) {
      this.dispatch('RESET');
    }
  }

  authorizedReset(): void {
    if (this.currentState === VVUNodeState.FAIL_CLOSED_LOCKDOWN) {
      this.dispatch('RESET');
    }
  }

  watchdogPing(): boolean {
    return this.currentState !== VVUNodeState.FAIL_CLOSED_LOCKDOWN;
  }
}
