import { describe, expect, it } from 'vitest';
import {
  civilInTz,
  isoWeekOf,
  moonPhaseIndex,
  seasonOf,
  timeOfDayOf,
} from '../../src/core/time';

describe('isoWeekOf', () => {
  it('computes week 29 for 16 July 2026 (the validated example)', () => {
    expect(isoWeekOf(2026, 7, 16)).toBe(29);
  });
  it('handles year-boundary edge cases per ISO 8601', () => {
    expect(isoWeekOf(2021, 1, 1)).toBe(53); // Fri 1 Jan 2021 → week 53 of 2020
    expect(isoWeekOf(2020, 12, 31)).toBe(53);
    expect(isoWeekOf(2019, 12, 30)).toBe(1); // Mon 30 Dec 2019 → week 1 of 2020
    expect(isoWeekOf(2026, 1, 1)).toBe(1); // Thu 1 Jan 2026 → week 1
  });
});

describe('civilInTz', () => {
  it('converts an instant into Luxembourg civil time (CEST in July)', () => {
    // 12:32 UTC in July = 14:32 in Europe/Luxembourg (UTC+2, DST)
    const instant = new Date(Date.UTC(2026, 6, 16, 12, 32));
    const c = civilInTz(instant, 'Europe/Luxembourg');
    expect(c).toEqual({ year: 2026, month: 7, day: 16, hour: 14, minute: 32 });
  });
  it('crosses the date line correctly', () => {
    const instant = new Date(Date.UTC(2026, 6, 16, 23, 0));
    expect(civilInTz(instant, 'Asia/Tokyo').day).toBe(17);
    expect(civilInTz(instant, 'America/Los_Angeles').day).toBe(16);
  });
});

describe('moonPhaseIndex', () => {
  it('returns new moon at the reference epoch', () => {
    expect(moonPhaseIndex(new Date(Date.UTC(2000, 0, 6, 18, 14)))).toBe(0);
  });
  it('returns full moon half a synodic month later', () => {
    const halfSynodicMs = (29.53058867 / 2) * 86400000;
    const d = new Date(Date.UTC(2000, 0, 6, 18, 14) + halfSynodicMs);
    expect(moonPhaseIndex(d)).toBe(4);
  });
  it('is always in range 0-7, including before the epoch', () => {
    for (const d of [new Date(1990, 5, 1), new Date(2026, 6, 16), new Date(2050, 0, 1)]) {
      const i = moonPhaseIndex(d);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(7);
    }
  });
});

describe('seasonOf / timeOfDayOf', () => {
  it('maps months to meteorological seasons (northern hemisphere)', () => {
    expect(seasonOf(7)).toBe('summer');
    expect(seasonOf(12)).toBe('winter');
    expect(seasonOf(3)).toBe('spring');
    expect(seasonOf(11)).toBe('autumn');
  });
  it('maps hours to times of day', () => {
    expect(timeOfDayOf(9)).toBe('morning');
    expect(timeOfDayOf(14)).toBe('afternoon');
    expect(timeOfDayOf(20)).toBe('evening');
    expect(timeOfDayOf(2)).toBe('late-night');
    expect(timeOfDayOf(23)).toBe('late-night');
  });
});
