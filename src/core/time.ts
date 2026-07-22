/**
 * Pure time functions. No DOM, no browser APIs, no network.
 * Everything is computed from a Date + an IANA time zone via Intl.
 */

export interface CivilDateTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
}

/** Civil date/time of `now` as seen in `timeZone`. */
export function civilInTz(now: Date, timeZone: string): CivilDateTime {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? NaN);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** ISO 8601 week number for a civil date. */
export function isoWeekOf(year: number, month: number, day: number): number {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = (date.getUTCDay() + 6) % 7; // 0 = Monday
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

const SYNODIC_MONTH_DAYS = 29.53058867;
/** Reference new moon: 2000-01-06 18:14 UTC. */
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14);

/** Moon phase as an index 0-7 (0 = new, 4 = full). Accurate to ~1 day. */
export function moonPhaseIndex(now: Date): number {
  const days = (now.getTime() - NEW_MOON_EPOCH_MS) / 86400000;
  const age = ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return Math.round((age / SYNODIC_MONTH_DAYS) * 8) % 8;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Meteorological season, northern hemisphere.
 * Documented V1 assumption: no location data, so no hemisphere detection.
 */
export function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late-night';

export function timeOfDayOf(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'late-night';
}
