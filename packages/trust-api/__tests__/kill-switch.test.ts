import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  activateKillSwitch,
  deactivateKillSwitch,
  isKillSwitchActive,
  getKillSwitchState,
  onKillSwitchChange,
} from '../src/kill-switch';

describe('kill-switch module', () => {
  beforeEach(() => {
    deactivateKillSwitch('test-reset', 'resetting state');
  });

  it('activateKillSwitch sets state to active', () => {
    const state = activateKillSwitch('admin', 'emergency shutdown');
    expect(state.active).toBe(true);
    expect(state.activatedBy).toBe('admin');
    expect(state.reason).toBe('emergency shutdown');
    expect(state.activatedAt).toBeTypeOf('number');
  });

  it('deactivateKillSwitch sets state to inactive', () => {
    activateKillSwitch('admin', 'test');
    const state = deactivateKillSwitch('admin', 'resolved');
    expect(state.active).toBe(false);
  });

  it('isKillSwitchActive returns correct boolean', () => {
    expect(isKillSwitchActive()).toBe(false);
    activateKillSwitch('admin', 'block');
    expect(isKillSwitchActive()).toBe(true);
    deactivateKillSwitch('admin', 'unblock');
    expect(isKillSwitchActive()).toBe(false);
  });

  it('getKillSwitchState returns read-only copy', () => {
    const state1 = getKillSwitchState();
    const state2 = getKillSwitchState();
    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2); // different references
  });

  it('onKillSwitchChange listener fires on state change', () => {
    const listener = vi.fn();
    const unsub = onKillSwitchChange(listener);

    activateKillSwitch('admin', 'trigger');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ active: true })
    );

    deactivateKillSwitch('admin', 'clear');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ active: false })
    );

    unsub();
  });

  it('listener errors are non-fatal', () => {
    const badListener = vi.fn(() => {
      throw new Error('boom');
    });
    const goodListener = vi.fn();

    const unsub1 = onKillSwitchChange(badListener);
    const unsub2 = onKillSwitchChange(goodListener);

    expect(() => activateKillSwitch('admin', 'test')).not.toThrow();
    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();

    unsub1();
    unsub2();
  });

  it('default state is inactive (fail-open)', () => {
    const state = getKillSwitchState();
    expect(state.active).toBe(false);
  });

  it('unsubscribe removes listener', () => {
    const listener = vi.fn();
    const unsub = onKillSwitchChange(listener);

    activateKillSwitch('admin', 'a');
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    activateKillSwitch('admin', 'b');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
