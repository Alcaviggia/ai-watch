import type { SiteAdapter } from './adapter.types';
import { chatgptAdapter } from './chatgpt';
import { claudeAdapter } from './claude';
import { geminiAdapter } from './gemini';
import { genericAdapter } from './generic';
import { grokAdapter } from './grok';
import { mistralAdapter } from './mistral';
import { perplexityAdapter } from './perplexity';

const BY_HOST: Record<string, SiteAdapter> = {
  'chatgpt.com': chatgptAdapter,
  'chat.openai.com': chatgptAdapter,
  'claude.ai': claudeAdapter,
  'gemini.google.com': geminiAdapter,
  'chat.mistral.ai': mistralAdapter,
  'perplexity.ai': perplexityAdapter,
  'www.perplexity.ai': perplexityAdapter,
  'grok.com': grokAdapter,
};

/** Human names for the popup, keyed by adapter id. */
export const SITE_NAMES: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  mistral: 'Mistral',
  perplexity: 'Perplexity',
  grok: 'Grok',
};

export function resolveAdapter(hostname: string): SiteAdapter {
  return BY_HOST[hostname] ?? genericAdapter;
}

/** Adapter id for a hostname, or null if the site is not known. */
export function knownSiteId(hostname: string): string | null {
  return BY_HOST[hostname]?.id ?? null;
}
