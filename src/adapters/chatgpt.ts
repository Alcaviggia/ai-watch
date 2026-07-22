import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/**
 * ChatGPT specialization. Known selectors first (as of mid-2026: a
 * ProseMirror contenteditable with id "prompt-textarea" and a send button
 * with data-testid "send-button"); generic heuristics as fallback, so a
 * ChatGPT redesign degrades gracefully instead of failing.
 */
export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',
  findComposer(doc) {
    return (
      doc.querySelector<HTMLElement>('#prompt-textarea') ??
      doc.querySelector<HTMLElement>('form [contenteditable="true"]') ??
      findComposerGeneric(doc)
    );
  },
  findSendButton(doc, composer) {
    return (
      doc.querySelector<HTMLElement>('[data-testid="send-button"]') ??
      doc.querySelector<HTMLElement>('button[aria-label*="prompt" i]') ??
      findSendButtonGeneric(doc, composer)
    );
  },
};
