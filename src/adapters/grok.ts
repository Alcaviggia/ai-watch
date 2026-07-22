import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/** Grok — plain textarea + submit; pure generic with its own identity. */
export const grokAdapter: SiteAdapter = {
  id: 'grok',
  findComposer(doc) {
    return findComposerGeneric(doc);
  },
  findSendButton(doc, composer) {
    return (
      doc.querySelector<HTMLElement>('button[type="submit"][aria-label]') ??
      findSendButtonGeneric(doc, composer)
    );
  },
};
