import type { BlockLanguage } from './complications/types';

/** "12 minutes", "1 hour 43 minutes", "less than a minute". */
export function humanizeDuration(ms: number, lang: BlockLanguage): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) {
    return lang === 'fr' ? "moins d'une minute" : 'less than a minute';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(
      lang === 'fr'
        ? `${hours} ${hours > 1 ? 'heures' : 'heure'}`
        : `${hours} ${hours > 1 ? 'hours' : 'hour'}`,
    );
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`);
  }
  return parts.join(' ');
}

/** Short form for the pastille: "+12 min", "+1 h 43", "<1 min". */
export function shortDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '<1 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `+${minutes} min`;
  return minutes === 0 ? `+${hours} h` : `+${hours} h ${String(minutes).padStart(2, '0')}`;
}
