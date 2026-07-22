import type { Settings } from './settings';
import { COMPLICATIONS, COMPLICATION_ORDER } from './complications/registry';
import type { BlockLanguage, ComplicationContext } from './complications/types';
import { shortDuration } from './format';

export interface RenderInput {
  settings: Settings;
  now: Date;
  /** Defaults to the machine's resolved IANA time zone. */
  timeZone?: string;
  elapsedMs: number | null;
  sessionMs: number | null;
}

const HEADER: Record<BlockLanguage, string> = {
  en: 'Current context',
  fr: 'Contexte actuel',
};

const FOOTER: Record<BlockLanguage, string> = {
  en: 'Use this information whenever it is relevant.',
  fr: "Utilise ces informations lorsque c'est pertinent.",
};

function buildContext(input: RenderInput): ComplicationContext {
  return {
    now: input.now,
    timeZone: input.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: input.settings.injection.blockLanguage,
    elapsedMs: input.elapsedMs,
    sessionMs: input.sessionMs,
  };
}

/**
 * The full context block.
 * Default layout follows the validated example. When both `weekday` and
 * `date` are enabled, they merge into one line: "Date: Thursday 16 July 2026".
 * A custom template (settings.injection.customTemplate) overrides the layout.
 */
export function renderFullBlock(input: RenderInput): string {
  const ctx = buildContext(input);
  const custom = input.settings.injection.customTemplate;
  if (custom !== null) return renderCustomTemplate(custom, input, ctx);

  const enabled = input.settings.complications;
  const lines: string[] = [HEADER[ctx.lang]];

  for (const id of COMPLICATION_ORDER) {
    if (!enabled[id]) continue;
    if (id === 'weekday' && enabled.date) continue; // merged into the date line
    const comp = COMPLICATIONS[id];
    let value = comp.value(ctx);
    if (value === null) continue;
    if (id === 'date' && enabled.weekday) {
      value = `${COMPLICATIONS.weekday.value(ctx)} ${value}`;
    }
    lines.push(`${comp.label[ctx.lang]}: ${value}`);
  }

  lines.push(FOOTER[ctx.lang]);
  return lines.join('\n');
}

/**
 * Compact form for follow-up messages: "⌚ Current time: 14:32 (+12 min)".
 * Labeled explicitly so the AI treats the time as exact, not approximate
 * (field-tested: the terse "⌚ 14:32" made ChatGPT hedge with "environ").
 */
export function renderCompact(input: RenderInput): string {
  const ctx = buildContext(input);
  const time = COMPLICATIONS.clock.value(ctx);
  const label = ctx.lang === 'fr' ? 'Heure actuelle' : 'Current time';
  let out = `⌚ ${label}: ${time}`;
  if (ctx.elapsedMs !== null && input.settings.complications.chronograph) {
    out += ` (${shortDuration(ctx.elapsedMs)})`;
  }
  return out;
}

/** Tokens available in custom templates: {date} {weekday} {time} … */
export function renderCustomTemplate(
  template: string,
  input: RenderInput,
  ctx?: ComplicationContext,
): string {
  const c = ctx ?? buildContext(input);
  const enabled = input.settings.complications;
  const tokenToId = {
    date: 'date',
    weekday: 'weekday',
    time: 'clock',
    timezone: 'timezone',
    isoWeek: 'isoWeek',
    elapsed: 'chronograph',
    session: 'session',
    season: 'season',
    timeOfDay: 'timeOfDay',
    moonPhase: 'moonPhase',
  } as const;

  // Line by line: a line whose known tokens ALL resolve to empty (disabled
  // or inapplicable complications) is dropped entirely — no orphan labels.
  const outLines: string[] = [];
  for (const line of template.split('\n')) {
    let hasKnownToken = false;
    let hasValue = false;
    const rendered = line.replace(/\{(\w+)\}/g, (match, token: string) => {
      const id = tokenToId[token as keyof typeof tokenToId];
      if (!id) return match; // unknown token: left as-is, visible to the user
      hasKnownToken = true;
      const value = enabled[id] ? (COMPLICATIONS[id].value(c) ?? '') : '';
      if (value !== '') hasValue = true;
      return value;
    });
    if (hasKnownToken && !hasValue) continue;
    outLines.push(rendered);
  }
  return outLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
