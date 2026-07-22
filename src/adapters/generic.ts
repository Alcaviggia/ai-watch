import type { SiteAdapter } from './adapter.types';

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 40 && r.height > 10;
}

/**
 * Heuristic: the main composer is the visible editable element closest to
 * the bottom of the viewport (chat UIs put the input at the bottom).
 */
export function findComposerGeneric(doc: Document): HTMLElement | null {
  const candidates = Array.from(
    doc.querySelectorAll<HTMLElement>(
      'textarea, [contenteditable="true"], [contenteditable="plaintext-only"]',
    ),
  ).filter(isVisible);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
  return candidates[0] ?? null;
}

const SEND_SELECTORS = [
  'button[type="submit"]',
  'button[data-testid*="send" i]',
  'button[aria-label*="send" i]',
  'button[aria-label*="envoyer" i]',
  'button[aria-label*="submit" i]',
];

/**
 * Heuristic: walk up from the composer and look for a send-like button in
 * each ancestor, so we pick the button that belongs to THIS composer.
 */
export function findSendButtonGeneric(
  _doc: Document,
  composer: HTMLElement,
): HTMLElement | null {
  let scope: HTMLElement | null = composer;
  for (let depth = 0; depth < 6 && scope; depth++, scope = scope.parentElement) {
    for (const selector of SEND_SELECTORS) {
      const btn = scope.querySelector<HTMLElement>(selector);
      if (btn && isVisible(btn)) return btn;
    }
  }
  return null;
}

export const genericAdapter: SiteAdapter = {
  id: 'generic',
  findComposer: findComposerGeneric,
  findSendButton: findSendButtonGeneric,
};
