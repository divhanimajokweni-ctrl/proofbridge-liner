/**
 * File: src/lib/watchdog/index.ts
 * Description: Monolithic architecture runtime control hooks.
 */
import { HeartbeatBus } from './HeartbeatBus';import { OrchestratorEngine } from './OrchestratorEngine';
let _bootstrapped = false;
export async function bootstrapHeartbeat(): Promise<void> {
  if (_bootstrapped) return;
  _bootstrapped = true;

  await HeartbeatBus.getInstance().activate();
  OrchestratorEngine.getInstance().start();
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