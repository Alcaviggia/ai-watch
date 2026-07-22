/**
 * Site adapters — the disposable edge of the architecture.
 *
 * Invariant #3 (generic-first): the generic adapter is the primary
 * abstraction. Named adapters are thin specializations that override only
 * what generic heuristics cannot guess. Improvements land in generic first.
 */

export interface SiteAdapter {
  /** Stable id used for settings and wrist-state storage keys. */
  id: string;
  /** The message composer (textarea or contenteditable), or null if absent. */
  findComposer(doc: Document): HTMLElement | null;
  /** The send control for this composer, or null if not found. */
  findSendButton(doc: Document, composer: HTMLElement): HTMLElement | null;
}
