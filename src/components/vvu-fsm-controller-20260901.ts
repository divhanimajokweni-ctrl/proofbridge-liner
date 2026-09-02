// src/components/vvu-fsm-controller-20260901.ts
// VVU Master Governance v2.1 - ONE FSM for both routes
export type NodeState = 'DISCONNECTED'|'PAIRING_BLE'|'TOTP_VERIFICATION'|'STEADY_STATE_LOCKED'|'LEAK_SIMULATION_ACTIVE'|'THERMAL_THROTTLE'|'FAIL_CLOSED_LOCKDOWN';
export type InputSymbol = 'INIT'|'CHAL'|'TOTP_OK'|'CLICK'|'CLEAR'|'WARN_65'|'WARN_75'|'CRIT_85'|'FAIL'|'RESET';
export interface Transition { from: NodeState; input: InputSymbol; to: NodeState; action: string; wormFact?: string; }
export const TRANSITIONS: Transition[] = [
  { from: 'DISCONNECTED', input: 'INIT', to: 'PAIRING_BLE', action: 'ECDH init', wormFact: 'BLE_ADV_BROADCAST' },
  { from: 'PAIRING_BLE', input: 'CHAL', to: 'TOTP_VERIFICATION', action: 'FIDO2 sig', wormFact: 'CHALLENGE_ISSUED' },
  { from: 'TOTP_VERIFICATION', input: 'TOTP_OK', to: 'STEADY_STATE_LOCKED', action: 'Grant at -33.9608,25.6022', wormFact: 'AUTH_SUCCESS' },
  { from: 'TOTP_VERIFICATION', input: 'FAIL', to: 'DISCONNECTED', action: 'Purge keys', wormFact: 'AUTH_FAIL' },
  { from: 'STEADY_STATE_LOCKED', input: 'CLICK', to: 'LEAK_SIMULATION_ACTIVE', action: 'Raycaster #ff4400 + 20m overlay', wormFact: 'LEAK_TRIGGERED' },
  { from: 'LEAK_SIMULATION_ACTIVE', input: 'CLEAR', to: 'STEADY_STATE_LOCKED', action: 'Restore HDPE Green', wormFact: 'LEAK_CLEARED' },
  { from: 'LEAK_SIMULATION_ACTIVE', input: 'WARN_65', to: 'THERMAL_THROTTLE', action: 'Decimate 62.5%', wormFact: 'THERMAL_WARN' },
  { from: 'THERMAL_THROTTLE', input: 'CRIT_85', to: 'FAIL_CLOSED_LOCKDOWN', action: 'Daly BMS cut <500ms', wormFact: 'FAIL_CLOSED' },
  { from: 'THERMAL_THROTTLE', input: 'RESET', to: 'LEAK_SIMULATION_ACTIVE', action: 'Hysteresis T<60C', wormFact: 'THROTTLE_CLEARED' },
  { from: 'FAIL_CLOSED_LOCKDOWN', input: 'RESET', to: 'STEADY_STATE_LOCKED', action: 'Hash 15 assets', wormFact: 'AUDIT_RESET' },
];
export class VVU_FSM {
  current: NodeState = 'DISCONNECTED'; log: Transition[] = [];
  transition(input: InputSymbol, tempC?: number): NodeState {
    if (tempC!== undefined) { if (tempC >= 85) input = 'CRIT_85'; else if (tempC >= 75) input = 'WARN_75'; else if (tempC >= 65) input = 'WARN_65'; }
    const t = TRANSITIONS.find(tr => tr.from === this.current && tr.input === input);
    if (!t) { this.current = 'FAIL_CLOSED_LOCKDOWN'; return this.current; }
    this.current = t.to; this.log.push(t); if(typeof window!== 'undefined') { console.log(`[${t.wormFact}] ${t.from} --${input}--> ${t.to}`); try { localStorage.setItem('vvu_worm', JSON.stringify(this.log.slice(-20))); } catch(e){} } return this.current;
  }
  replay(inputs: InputSymbol[]): NodeState { this.current='DISCONNECTED'; inputs.forEach(i=>this.transition(i)); return this.current; }
}
