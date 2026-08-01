import { AgentStateMachine } from '../src/lib/agents/stateMachine';

console.log('=== VVU STATE MACHINE BOUNDARY TEST ===\n');

// 1. Happy path
const sm = new AgentStateMachine('TEST-BOT', 'SESSION-01');
console.log(`Start: ${sm.getState() === 'IDLE' ? 'PASS (IDLE)' : 'FAIL'}`);

sm.transition('INITIATE');
sm.transition('RECEIVE_PAYLOAD');
console.log(`Sandbox validation: ${sm.getState() === 'SANDBOX_VALIDATION' ? 'PASS' : 'FAIL'}`);

sm.transition('PASS_SANDBOX');
sm.transition('DISPATCH');
console.log(`Happy path complete: ${sm.getState() === 'COMPLETED' ? 'PASS (COMPLETED)' : 'FAIL'}`);

// 2. Illegal transition
const sm2 = new AgentStateMachine('TEST-BOT-2', 'SESSION-02');
sm2.transition('INITIATE'); // PROCESSING
const result = sm2.transition('DISPATCH'); // Illegal: PROCESSING -> DISPATCH
console.log(`Illegal transition caught: ${result === 'FAILED' ? 'PASS' : 'FAIL'}`);
console.log(`Error trace: ${sm2.getContext().errorLog}`);

console.log('\n=== BOUNDARY TEST COMPLETE ===');
