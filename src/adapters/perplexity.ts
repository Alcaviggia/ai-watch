import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/** Perplexity — contenteditable ask-input (2025 UI) or legacy textarea. */
export const perplexityAdapter: SiteAdapter = {
  id: 'perplexity',
  findComposer(doc) {
    return (
      doc.querySelector<HTMLElement>('#ask-input') ??
      doc.querySelector<HTMLElement>('textarea[placeholder]') ??
      findComposerGeneric(doc)
    );
  },
  findSendButton(doc, composer) {
    return (
      doc.querySelector<HTMLElement>('button[data-testid="submit-button"]') ??
      doc.querySelector<HTMLElement>('button[aria-label*="submit" i]') ??
      findSendButtonGeneric(doc, composer)
    );
  },
};
