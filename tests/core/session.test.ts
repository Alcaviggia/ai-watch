import { describe, expect, it } from 'vitest';
import {
  initialWristState,
  tick,
  wantsFullBlock,
} from '../../src/core/session-tracker';

const MIN = 60000;
const T0 = 1_800_000_000_000; // arbitrary epoch

describe('tick', () => {
  it('starts a session on the very first message', () => {
    const r = tick(initialWristState(), T0, 30);
    expect(r.isSessionStart).toBe(true);
    expect(r.elapsedMs).toBeNull();
    expect(r.sessionMs).toBe(0);
    expect(r.state.promptCount).toBe(1);
  });

  it('continues the session within the reset window', () => {
    const r1 = tick(initialWristState(), T0, 30);
    const r2 = tick(r1.state, T0 + 12 * MIN, 30);
    expect(r2.isSessionStart).toBe(false);
    expect(r2.elapsedMs).toBe(12 * MIN);
    expect(r2.sessionMs).toBe(12 * MIN);
    const r3 = tick(r2.state, T0 + 103 * MIN, 30); // +91 min later > 30 → new session
    expect(r3.isSessionStart).toBe(true);
  });

  it('resets after the silence threshold', () => {
    const r1 = tick(initialWristState(), T0, 30);
    const r2 = tick(r1.state, T0 + 31 * MIN, 30);
    expect(r2.isSessionStart).toBe(true);
    expect(r2.elapsedMs).toBeNull();
    expect(r2.sessionMs).toBe(0);
    expect(r2.state.promptCount).toBe(2); // caseback counter never resets
  });
});

describe('wantsFullBlock', () => {
  const start = tick(initialWristState(), T0, 30);
  const followUp = tick(start.state, T0 + 10 * MIN, 30);

  it('full block at session start, compact on follow-ups (session-start mode)', () => {
    expect(wantsFullBlock(start, 'session-start', 120)).toBe(true);
    expect(wantsFullBlock(followUp, 'session-start', 120)).toBe(false);
  });

  it('always full in every-message mode', () => {
    expect(wantsFullBlock(followUp, 'every-message', 120)).toBe(true);
  });

  it('full again when the gap exceeds fullBlockAfterMinutes', () => {
    const longGap = tick(followUp.state, T0 + 10 * MIN + 125 * MIN, 300); // session survives (reset=300)
    expect(longGap.isSessionStart).toBe(false);
    expect(wantsFullBlock(longGap, 'session-start', 120)).toBe(true);
  });
});
