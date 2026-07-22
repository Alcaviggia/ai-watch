import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/** Claude.ai — ProseMirror contenteditable; generic fallback. */
export const claudeAdapter: SiteAdapter = {
  id: 'claude',
  findComposer(doc) {
    return (
      doc.querySelector<HTMLElement>('div.ProseMirror[contenteditable="true"]') ??
      doc.querySelector<HTMLElement>('[data-testid="chat-input"]') ??
      findComposerGeneric(doc)
    );
  },
  findSendButton(doc, composer) {
    return (
      doc.querySelector<HTMLElement>('button[aria-label*="send message" i]') ??
      doc.querySelector<HTMLElement>('button[aria-label*="send" i]') ??
      findSendButtonGeneric(doc, composer)
    );
  },
};
