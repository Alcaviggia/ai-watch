import type { DialId } from '../core/settings';

/**
 * Dial tokens — the single source of truth for each collection's sensation.
 * A dial is a token set: materials, colors, hands, typography AND motion
 * timing. Never a different component, never a different feature set
 * (invariant #2). "The watch must not only be beautiful. It must make you
 * want to keep it."
 */
export interface DialTokens {
  name: string;
  /** Face & case materials. */
  face: string;
  caseColor: string;
  bezel: string;
  /** Markers. */
  index: string;
  numerals: 'roman' | 'baton' | 'instrument';
  /** Hands. */
  hour: string;
  minute: string;
  second: string;
  /** Glass reflection opacity (0-1). */
  glass: number;
  /** Opening wind-up duration (ms) — Heritage takes its time. */
  windMs: number;
  /** CSS transition of the second hand — the tick's character. */
  tick: string;
  /** The pastille chip, dressed to match. */
  chipBg: string;
  chipFg: string;
  chipAccent: string;
  chipBorder: string;
  chipFont: string;
}

export const DIAL_TOKENS: Record<DialId, DialTokens> = {
  heritage: {
    name: 'Heritage',
    face: '#f6f0e4',
    caseColor: '#d9cdb6',
    bezel: '#c7b997',
    index: '#4a4237',
    numerals: 'roman',
    hour: '#3d372e',
    minute: '#3d372e',
    second: '#8a7b5c',
    glass: 0.13,
    windMs: 900,
    tick: 'transform 0.9s linear', // a near-sweep, mechanical calm
    chipBg: '#f3ecdd',
    chipFg: '#3d372e',
    chipAccent: '#8a7b5c',
    chipBorder: '#d9cdb6',
    chipFont: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
  },
  studio: {
    name: 'Studio',
    face: '#fafaf9',
    caseColor: '#e7e5e4',
    bezel: '#d6d3d1',
    index: '#1c1917',
    numerals: 'baton',
    hour: '#1c1917',
    minute: '#1c1917',
    second: '#78716c',
    glass: 0.1,
    windMs: 450,
    tick: 'transform 0.2s cubic-bezier(0.4, 2.2, 0.6, 1)', // crisp, precise snap
    chipBg: '#fafaf9',
    chipFg: '#1c1917',
    chipAccent: '#78716c',
    chipBorder: '#c2beba',
    chipFont: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  lab: {
    name: 'Lab',
    face: '#141210',
    caseColor: '#2b2724',
    bezel: '#453f39',
    index: '#d6d3d1',
    numerals: 'instrument',
    hour: '#e7e5e4',
    minute: '#e7e5e4',
    second: '#f97316',
    glass: 0.06,
    windMs: 280,
    tick: 'transform 0.08s linear', // instant, instrument-sharp
    chipBg: '#0c0a09',
    chipFg: '#e7e5e4',
    chipAccent: '#f97316',
    chipBorder: '#8a837b',
    chipFont: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
  },
};
