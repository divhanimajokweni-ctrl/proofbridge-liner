/**
 * File: src/lib/watchdog/index.ts
 * Description: Monolithic architecture runtime control hooks.
 */
import { HeartbeatBus } from './HeartbeatBus';import { OrchestratorEngine } from './OrchestratorEngine';
let _bootstrapped = false;
export async function bootstrapHeartbeat(): Promise<void> {
  if (_bootstrapped) return;

  try {
    await HeartbeatBus.getInstance().activate();
    OrchestratorEngine.getInstance().start();
    _bootstrapped = true;
  } catch (error) {
    console.error('Failed to bootstrap heartbeat system:', error);
    // Reset bootstrapped flag on failure to allow retry
    _bootstrapped = false;
    throw error;
  }
}
export function suspendHeartbeat(): void {
  HeartbeatBus.getInstance().suspend();
  OrchestratorEngine.getInstance().pause();
}
export function shutdownHeartbeat(): void {
  OrchestratorEngine.getInstance().stop();
  HeartbeatBus.getInstance().deactivate();
  _bootstrapped = false;
}