import type { ComplicationId } from '../settings';

export type BlockLanguage = 'en' | 'fr';

/** Everything a complication may look at. Pure data, computed upstream. */
export interface ComplicationContext {
  now: Date;
  /** IANA time zone the block is expressed in (e.g. "Europe/Luxembourg"). */
  timeZone: string;
  lang: BlockLanguage;
  /** ms since the previous message in this session; null on session start. */
  elapsedMs: number | null;
  /** ms since the session started; null if unknown. */
  sessionMs: number | null;
}

export interface Complication {
  id: ComplicationId;
  /** Line label in the default block. */
  label: Record<BlockLanguage, string>;
  /** Value for the block, or null when not applicable right now. */
  value(ctx: ComplicationContext): string | null;
}
