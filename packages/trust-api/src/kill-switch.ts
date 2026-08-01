import type { KillSwitchState } from '@proofbridge/trust-types';

/**
 * Kill Switch Module
 *
 * Manages the global kill-switch state. When active, every enforcement
 * gate rejects all transactions. State is in-memory by default with
 * optional Redis backing for distributed deployments.
 *
 * If the process restarts, the kill-switch defaults to inactive
 * (fail-open for availability).
 */

let killSwitchState: KillSwitchState = {
  active: false,
};

type KillSwitchListener = (state: KillSwitchState) => void;
const listeners: KillSwitchListener[] = [];

/**
 * Activate the global kill switch.
 * When active, all enforcePolicyGate calls reject transactions.
 */
export function activateKillSwitch(
  activatedBy: string,
  reason: string
): KillSwitchState {
  killSwitchState = {
    active: true,
    activatedAt: Date.now(),
    activatedBy,
    reason,
  };

  notifyListeners();
  return { ...killSwitchState };
}

/**
 * Deactivate the global kill switch.
 */
export function deactivateKillSwitch(
  deactivatedBy: string,
  reason: string
): KillSwitchState {
  killSwitchState = {
    active: false,
  };

  notifyListeners();
  return { ...killSwitchState };
}

/**
 * Check if the kill switch is currently active.
 */
export function isKillSwitchActive(): boolean {
  return killSwitchState.active === true;
}

/**
 * Get the current kill switch state (read-only copy).
 */
export function getKillSwitchState(): KillSwitchState {
  return { ...killSwitchState };
}

/**
 * Subscribe to kill switch state changes.
 * Returns an unsubscribe function.
 */
export function onKillSwitchChange(listener: KillSwitchListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notifyListeners(): void {
  const state = { ...killSwitchState };
  for (const listener of listeners) {
    try {
      listener(state);
    } catch {
      // Listener errors are non-fatal
    }
  }
}
