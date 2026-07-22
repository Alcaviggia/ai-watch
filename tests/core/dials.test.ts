import { describe, expect, it } from 'vitest';
import { DIAL_IDS } from '../../src/core/settings';
import { DIAL_TOKENS } from '../../src/shared/dials';

describe('dial tokens', () => {
  it('every dial in the collection has a complete token set', () => {
    for (const id of DIAL_IDS) {
      const t = DIAL_TOKENS[id];
      expect(t, `tokens for ${id}`).toBeDefined();
      for (const key of ['face', 'caseColor', 'bezel', 'index', 'hour', 'second', 'tick', 'chipBg', 'chipFg', 'chipFont'] as const) {
        expect(t[key], `${id}.${key}`).toBeTruthy();
      }
      expect(t.windMs).toBeGreaterThan(0);
      expect(t.glass).toBeGreaterThan(0);
      expect(t.glass).toBeLessThan(1);
    }
  });
  it('three personalities, three tempos — Heritage slow, Lab sharp', () => {
    expect(DIAL_TOKENS.heritage.windMs).toBeGreaterThan(DIAL_TOKENS.studio.windMs);
    expect(DIAL_TOKENS.studio.windMs).toBeGreaterThan(DIAL_TOKENS.lab.windMs);
  });
});
