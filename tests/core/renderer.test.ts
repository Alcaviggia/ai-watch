import { describe, expect, it } from 'vitest';
import { defaultSettings, type Settings } from '../../src/core/settings';
import { renderCompact, renderFullBlock } from '../../src/core/template-renderer';

/** The instant of the validated example: Thu 16 July 2026, 14:32 in Luxembourg. */
const EXAMPLE_NOW = new Date(Date.UTC(2026, 6, 16, 12, 32)); // 14:32 CEST
const EXAMPLE_TZ = 'Europe/Luxembourg';
const MIN = 60000;

function exampleInput(overrides: Partial<Settings> = {}) {
  const settings: Settings = { ...defaultSettings(), ...overrides };
  return {
    settings,
    now: EXAMPLE_NOW,
    timeZone: EXAMPLE_TZ,
    elapsedMs: 12 * MIN,
    sessionMs: 103 * MIN, // 1 h 43
  };
}

describe('renderFullBlock — the golden example', () => {
  it('reproduces the validated specification block', () => {
    const input = exampleInput();
    input.settings.complications.isoWeek = true; // the example shows ISO week
    expect(renderFullBlock(input)).toBe(
      [
        'Current context',
        'Date: Thursday 16 July 2026',
        'Time: 14:32',
        'Timezone: Europe/Luxembourg',
        'ISO Week: 29',
        'Elapsed since previous message: 12 minutes',
        'Current session: 1 hour 43 minutes',
        'Use this information whenever it is relevant.',
      ].join('\n'),
    );
  });

  it('renders in French when blockLanguage is fr', () => {
    const input = exampleInput();
    input.settings.injection.blockLanguage = 'fr';
    const block = renderFullBlock(input);
    expect(block).toContain('Contexte actuel');
    expect(block).toContain('Date: jeudi 16 juillet 2026');
    expect(block).toContain('Écoulé depuis le message précédent: 12 minutes');
    expect(block).toContain('Session en cours: 1 heure 43 minutes');
  });

  it('omits chronograph and session lines at session start (null values)', () => {
    const input = { ...exampleInput(), elapsedMs: null, sessionMs: 0 };
    const block = renderFullBlock(input);
    expect(block).not.toContain('Elapsed since previous message');
    expect(block).toContain('Current session: less than a minute');
  });

  it('respects disabled complications', () => {
    const input = exampleInput();
    input.settings.complications.timezone = false;
    input.settings.complications.weekday = false;
    const block = renderFullBlock(input);
    expect(block).not.toContain('Timezone');
    expect(block).toContain('Date: 16 July 2026'); // no weekday merged
  });

  it('renders the charm complications when enabled', () => {
    const input = exampleInput();
    input.settings.complications.season = true;
    input.settings.complications.timeOfDay = true;
    input.settings.complications.moonPhase = true;
    const block = renderFullBlock(input);
    expect(block).toContain('Season: Summer');
    expect(block).toContain('Time of day: Afternoon');
    expect(block).toMatch(/Moon phase: (New Moon|Waxing|First|Full|Waning|Last).*/);
  });
});

describe('renderFullBlock — custom template', () => {
  it('substitutes tokens and drops lines of disabled complications', () => {
    const input = exampleInput();
    input.settings.complications.moonPhase = false;
    input.settings.injection.customTemplate = [
      'It is {time} on {weekday} ({timezone}).',
      'Moon: {moonPhase}',
      'Last message: {elapsed} ago.',
    ].join('\n');
    expect(renderFullBlock(input)).toBe(
      ['It is 14:32 on Thursday (Europe/Luxembourg).', 'Last message: 12 minutes ago.'].join('\n'),
    );
  });

  it('leaves unknown tokens visible so the user can spot typos', () => {
    const input = exampleInput();
    input.settings.injection.customTemplate = 'Hello {tiem}';
    expect(renderFullBlock(input)).toBe('Hello {tiem}');
  });
});

describe('renderCompact', () => {
  it('renders the pastille form', () => {
    expect(renderCompact(exampleInput())).toBe('⌚ Current time: 14:32 (+12 min)');
  });
  it('omits elapsed at session start', () => {
    expect(renderCompact({ ...exampleInput(), elapsedMs: null })).toBe('⌚ Current time: 14:32');
  });
  it('formats hours in short durations', () => {
    expect(renderCompact({ ...exampleInput(), elapsedMs: 103 * MIN })).toBe(
      '⌚ Current time: 14:32 (+1 h 43)',
    );
  });
});
