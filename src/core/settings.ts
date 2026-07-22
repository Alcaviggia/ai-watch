/**
 * Versioned settings schema.
 *
 * Rules:
 * - Every persisted settings object carries `schemaVersion`.
 * - `migrate()` upgrades any older object to the current shape and is the
 *   ONLY entry point for reading stored settings.
 * - Defaults define the validated V1 experience: "La Chronographe"
 *   configuration on "La Sobre" dial, injection at session start.
 */

/** The nine Calibre 1.0 complications. Order = display order. */
export const COMPLICATION_IDS = [
  'date',
  'clock',
  'timezone',
  'weekday',
  'isoWeek',
  'chronograph', // elapsed since previous message
  'session', // session duration
  'season',
  'timeOfDay',
  'moonPhase',
] as const;
export type ComplicationId = (typeof COMPLICATION_IDS)[number];

/**
 * The three Calibre 1.0 dials — identical features, different sensation.
 * Heritage: classical watchmaking. Studio: minimal Bauhaus (default).
 * Lab: instrument/chronograph spirit, mechanism proudly visible.
 * A dial is a token set (colors, hands, typography AND motion timing).
 */
export const DIAL_IDS = ['heritage', 'studio', 'lab'] as const;
export type DialId = (typeof DIAL_IDS)[number];

export type InjectionFrequency = 'session-start' | 'every-message' | 'manual';

export type PastilleSize = 's' | 'm' | 'l';

export type UiLanguage =
  | 'auto'
  | 'en'
  | 'fr'
  | 'nl'
  | 'es'
  | 'it'
  | 'pt'
  | 'zh'
  | 'ru';

export interface SiteSetting {
  /** Watch worn on this site? */
  enabled: boolean;
  /** The watch found its place at least once on this wrist. */
  everWorked?: boolean;
  /** The first-gift prompt was offered on this wrist (once, ever). */
  giftOffered?: boolean;
}

export interface Settings {
  schemaVersion: number;
  /** Master switch — the crown. Pulled out = everything stops. */
  crownRunning: boolean;
  dial: DialId;
  pastilleSize: PastilleSize;
  /** Interface language; 'auto' follows the browser. Engraving language is separate. */
  uiLanguage: UiLanguage;
  complications: Record<ComplicationId, boolean>;
  injection: {
    frequency: InjectionFrequency;
    /** Minutes of silence after which a new session starts. */
    sessionResetMinutes: number;
    /** If elapsed exceeds this (minutes), re-inject the full block. */
    fullBlockAfterMinutes: number;
    /** Language of the injected block (independent from UI language). */
    blockLanguage: 'en' | 'fr';
    /** User-editable template; null = built-in default for blockLanguage. */
    customTemplate: string | null;
  };
  /** Keyed by site id (adapter id) or origin for generic sites. */
  sites: Record<string, SiteSetting>;
}

export const SCHEMA_VERSION = 1;

export function defaultSettings(): Settings {
  return {
    schemaVersion: SCHEMA_VERSION,
    crownRunning: true,
    dial: 'studio',
    pastilleSize: 'm',
    uiLanguage: 'auto',
    complications: {
      date: true,
      clock: true,
      timezone: true,
      weekday: true,
      isoWeek: false, // "Grande Complication" territory — off by default
      chronograph: true,
      session: true,
      season: false,
      timeOfDay: false,
      moonPhase: false,
    },
    injection: {
      frequency: 'session-start',
      sessionResetMinutes: 30,
      fullBlockAfterMinutes: 120,
      blockLanguage: 'en',
      customTemplate: null,
    },
    sites: {},
  };
}

/**
 * Upgrade any stored object to the current schema.
 * Unknown/corrupt input falls back to defaults (never crash on user data).
 */
export function migrate(stored: unknown): Settings {
  if (
    typeof stored !== 'object' ||
    stored === null ||
    typeof (stored as { schemaVersion?: unknown }).schemaVersion !== 'number'
  ) {
    return defaultSettings();
  }
  const s = stored as Partial<Settings> & { schemaVersion: number; dial?: string };
  // Legacy dial ids from the pre-release collection map to their heirs.
  const legacyDials: Record<string, (typeof DIAL_IDS)[number]> = {
    sobre: 'studio',
    paddock: 'lab',
    transparente: 'lab',
  };
  if (s.dial && s.dial in legacyDials) s.dial = legacyDials[s.dial];
  if (s.dial && !(DIAL_IDS as readonly string[]).includes(s.dial)) s.dial = 'studio';
  if (s.schemaVersion === SCHEMA_VERSION) {
    // Merge over defaults so newly added fields always exist.
    const d = defaultSettings();
    return {
      ...d,
      ...s,
      complications: { ...d.complications, ...s.complications },
      injection: { ...d.injection, ...s.injection },
      sites: { ...d.sites, ...s.sites },
      schemaVersion: SCHEMA_VERSION,
    };
  }
  // Future: stepwise upgrades (v1 -> v2 -> …). No older versions exist yet.
  return defaultSettings();
}
