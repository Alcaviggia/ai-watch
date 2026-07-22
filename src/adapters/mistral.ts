import type { SiteAdapter } from './adapter.types';
import { findComposerGeneric, findSendButtonGeneric } from './generic';

/** Mistral Le Chat — ProseMirror or textarea; generic-first by design. */
export const mistralAdapter: SiteAdapter = {
  id: 'mistral',
  findComposer(doc) {
    return (
      doc.querySelector<HTMLElement>('div.ProseMirror[contenteditable="true"]') ??
      findComposerGeneric(doc)
    );
  },
  findSendButton(doc, composer) {
    return findSendButtonGeneric(doc, composer);
  },
};
