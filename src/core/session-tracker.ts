/**
 * Session tracking — pure logic over a small persisted state ("wrist state").
 * Storage wiring happens in the content script (Step 2); this file never
 * touches browser APIs.
 */

export interface WristState {
  /** ms epoch of the previous message, or null if none yet. */
  lastMessageAt: number | null;
  /** ms epoch when the current session started, or null if none yet. */
  sessionStartedAt: number | null;
  /** Caseback counter: total messages accompanied by the watch. */
  promptCount: number;
}

export function initialWristState(): WristState {
  return { lastMessageAt: null, sessionStartedAt: null, promptCount: 0 };
}

export interface TickResult {
  state: WristState;
  /** ms since previous message; null when this message starts a new session. */
  elapsedMs: number | null;
  /** ms since session start (0 on session start). */
  sessionMs: number;
  isSessionStart: boolean;
}

/**
 * Called when a message is about to be sent.
 * A new session starts when there is no previous message or when the gap
 * exceeds `resetMinutes` of silence.
 */
export function tick(state: WristState, nowMs: number, resetMinutes: number): TickResult {
  const gap = state.lastMessageAt === null ? null : nowMs - state.lastMessageAt;
  const isSessionStart =
    gap === null || gap > resetMinutes * 60000 || state.sessionStartedAt === null;

  const sessionStartedAt = isSessionStart ? nowMs : (state.sessionStartedAt as number);

  return {
    state: {
      lastMessageAt: nowMs,
      sessionStartedAt,
      promptCount: state.promptCount + 1,
    },
    elapsedMs: isSessionStart ? null : gap,
    sessionMs: nowMs - sessionStartedAt,
    isSessionStart,
  };
}

/**
 * Should this message carry the FULL block (vs the compact form)?
 * Rule validated in design: full block at session start; full block again
 * when the gap exceeds `fullBlockAfterMinutes` (context likely changed);
 * 'every-message' frequency always sends the full block.
 */
export function wantsFullBlock(
  result: TickResult,
  frequency: 'session-start' | 'every-message' | 'manual',
  fullBlockAfterMinutes: number,
): boolean {
  if (frequency === 'every-message') return true;
  if (result.isSessionStart) return true;
  return result.elapsedMs !== null && result.elapsedMs > fullBlockAfterMinutes * 60000;
}
