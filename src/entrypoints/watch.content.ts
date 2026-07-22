import { resolveAdapter } from '../adapters/resolver';
import { buildPreview } from '../core/preview';
import { appendToComposer, composerText } from '../content/injector';
import { GIFT_PROMPT } from '../shared/gift';
import { resolveLocale } from '../shared/i18n';
import { createPastille, type Pastille } from '../content/pastille';
import { loadSettings, loadWrist, onSettingsChanged, saveWrist } from '../shared/storage';
import { tick, wantsFullBlock, type WristState } from '../core/session-tracker';
import { renderCompact, renderFullBlock } from '../core/template-renderer';
import type { Settings } from '../core/settings';

export default defineContentScript({
  matches: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://chat.mistral.ai/*',
    'https://www.perplexity.ai/*',
    'https://perplexity.ai/*',
    'https://grok.com/*',
  ],
  main() {
    void init();
  },
});

async function init(): Promise<void> {
  const adapter = resolveAdapter(location.hostname);
  // Named wrists share their adapter id; free wrists are their hostname.
  const siteId = adapter.id === 'generic' ? location.hostname : adapter.id;
  let settings: Settings = await loadSettings();
  onSettingsChanged((s) => (settings = s));
  let wrist: WristState = await loadWrist(siteId);

  let pastille: Pastille | null = null;
  let wiredComposer: HTMLElement | null = null;
  /** Re-entrancy flag: the re-triggered send must pass through untouched. */
  let bypassNext = false;
  /** The very button the user clicked — re-used for the re-triggered send. */
  let reClickTarget: HTMLElement | null = null;

  const siteWorn = (): boolean => settings.sites[siteId]?.enabled !== false;
  const isActive = (): boolean => settings.crownRunning && siteWorn();

  async function markGiftOffered(): Promise<void> {
    settings.sites[siteId] = {
      ...settings.sites[siteId],
      enabled: siteWorn(),
      giftOffered: true,
    };
    await browser.storage.local.set({ settings });
  }

  async function toggleWorn(): Promise<void> {
    settings.sites[siteId] = { ...settings.sites[siteId], enabled: !siteWorn() };
    await browser.storage.local.set({ settings });
  }

  function refreshPastille(composer: HTMLElement): void {
    if (!pastille)
      pastille = createPastille(document, {
        onToggleWorn: () => void toggleWorn(),
        onOpenWorkshop: () =>
          void browser.runtime.sendMessage({ type: 'open-workshop' }).catch(() => {}),
        onGiftAccept: () => {
          const c = adapter.findComposer(document);
          if (c) appendToComposer(c, GIFT_PROMPT[settings.injection.blockLanguage]);
          void markGiftOffered();
        },
        onGiftDismiss: () => void markGiftOffered(),
      });
    pastille.setWorn(siteWorn());
    pastille.setSize(settings.pastilleSize);
    pastille.setDial(settings.dial);
    pastille.setLocale(resolveLocale(settings.uiLanguage, navigator.language));
    pastille.setGiftVisible(settings.sites[siteId]?.giftOffered !== true);
    const p = buildPreview(settings, wrist, Date.now());
    pastille.setPreview(p.text, p.clock);
    pastille.reposition(composer);
  }

  function blockAlreadyPresent(text: string): boolean {
    return (
      /⌚ .*\d{2}:\d{2}/.test(text) ||
      text.includes('Use this information whenever it is relevant.') ||
      text.includes("Utilise ces informations lorsque c'est pertinent.")
    );
  }

  function onSendIntent(e: Event): void {
    if (!isActive()) return;
    if (bypassNext) {
      bypassNext = false;
      return;
    }
    const composer = adapter.findComposer(document);
    if (!composer) return;
    const text = composerText(composer);
    if (text.trim() === '' || blockAlreadyPresent(text)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const result = tick(wrist, Date.now(), settings.injection.sessionResetMinutes);
    wrist = result.state;
    void saveWrist(siteId, wrist);

    const isFull = wantsFullBlock(
      result,
      settings.injection.frequency,
      settings.injection.fullBlockAfterMinutes,
    );
    const input = {
      settings,
      now: new Date(),
      elapsedMs: result.elapsedMs,
      sessionMs: result.sessionMs,
    };
    appendToComposer(composer, isFull ? renderFullBlock(input) : renderCompact(input));
    pastille?.tick();

    bypassNext = true;
    // Let the editor process the insertion, then re-trigger the send —
    // preferring the very control the user actually used.
    const clicked = reClickTarget;
    reClickTarget = null;
    requestAnimationFrame(() => {
      const btn = clicked ?? adapter.findSendButton(document, composer);
      if (btn) {
        btn.click();
      } else {
        bypassNext = true;
        composer.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
        );
      }
    });
  }

  // Send triggers: Enter (without Shift) in the composer, capture phase…
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      const composer = adapter.findComposer(document);
      if (!composer || !e.composedPath().includes(composer)) return;
      onSendIntent(e);
    },
    true,
  );

  // …and clicks: we no longer need to RECOGNIZE the send button.
  // The button the user clicks IS the button we re-use (re-click strategy):
  // intercept, inject, then re-click the very same element. Works in every
  // language, on every redesign.
  const NON_SEND = /(micro|voice|voix|dicter|audio|attach|joindre|pi\u00e8ce|file|fichier|upload|photo|image|cam\u00e9ra|camera|menu|search|recherche|settings|param|emoji)/;
  document.addEventListener(
    'click',
    (e) => {
      if (!isActive()) return;
      if (bypassNext) return; // the re-click passes through in onSendIntent
      const composer = wiredComposer;
      if (!composer) return;
      const path = e.composedPath();
      const btn = path.find(
        (el): el is HTMLElement => el instanceof HTMLElement && el.tagName === 'BUTTON',
      );
      if (!btn || btn.getRootNode() !== document) return; // none, or our own UI
      // The button must live near the composer (shared container, 8 levels).
      let container: HTMLElement | null = composer;
      let shared = false;
      for (let i = 0; i < 8 && container; i++, container = container.parentElement) {
        if (container.contains(btn)) {
          shared = true;
          break;
        }
      }
      if (!shared) return;
      // Exclude obvious non-send controls (mic, attach, pickers with menus).
      if (btn.getAttribute('aria-haspopup') || btn.hasAttribute('aria-expanded')) return;
      const label = `${btn.getAttribute('aria-label') ?? ''} ${btn.textContent ?? ''}`.toLowerCase();
      if (NON_SEND.test(label)) return;
      const text = composerText(composer);
      if (text.trim() === '' || blockAlreadyPresent(text)) return;
      reClickTarget = btn;
      onSendIntent(e);
    },
    true,
  );

  // Wrist state machine: report transitions so the popup can speak.
  let lastReported: 'found' | 'lost' | null = null;
  function reportComposer(found: boolean): void {
    const state = found ? 'found' : 'lost';
    if (state === lastReported) return;
    lastReported = state;
    if (found && settings.sites[siteId]?.everWorked !== true) {
      settings.sites[siteId] = { ...settings.sites[siteId], enabled: siteWorn(), everWorked: true };
      void browser.storage.local.set({ settings });
    }
    void browser.storage.local.set({
      [`wrist-status:${siteId}`]: { found, at: Date.now() },
    });
  }

  // Safety net: some UIs send via a form submission.
  document.addEventListener(
    'submit',
    (e) => {
      const composer = wiredComposer;
      if (!composer || !isActive() || bypassNext) return;
      const form = e.target as HTMLElement | null;
      if (!form || !form.contains(composer)) return;
      const text = composerText(composer);
      if (text.trim() === '' || blockAlreadyPresent(text)) return;
      onSendIntent(e);
    },
    true,
  );

  // SPA-safe composer watcher: cheap periodic scan.
  setInterval(() => {
    const composer = adapter.findComposer(document);
    reportComposer(composer !== null);
    if (!composer) {
      wiredComposer = null;
      return;
    }
    if (!settings.crownRunning) {
      // Crown pulled: everything stops, everywhere — chip included.
      pastille?.destroy();
      pastille = null;
      wiredComposer = composer;
      return;
    }
    // Watch taken off on this site: chip stays, grayed, one click to re-wear.
    wiredComposer = composer;
    refreshPastille(composer);
  }, 1500);
}
