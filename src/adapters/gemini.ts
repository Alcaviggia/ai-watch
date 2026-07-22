import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/** Gemini — Quill editor (.ql-editor); generic fallback. */
export const geminiAdapter: SiteAdapter = {
  id: 'gemini',
  findComposer(doc) {
    return (
      doc.querySelector<HTMLElement>('.ql-editor[contenteditable="true"]') ??
      doc.querySelector<HTMLElement>('rich-textarea [contenteditable="true"]') ??
      findComposerGeneric(doc)
    );
  },
  findSendButton(doc, composer) {
    return (
      doc.querySelector<HTMLElement>('button[aria-label*="send" i]') ??
      doc.querySelector<HTMLElement>('.send-button') ??
      findSendButtonGeneric(doc, composer)
    );
  },
};
