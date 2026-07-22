/**
 * The pastille — the small watch worn beside the message field.
 * Dressed by the chosen dial (tokens applied inline), Shadow DOM isolated.
 */
import type { DialId, PastilleSize } from '../core/settings';
import { DIAL_TOKENS } from '../shared/dials';
import { makeT, type UiLocale } from '../shared/i18n';

export interface Pastille {
  /** Update the exact upcoming block and the chip's clock label. */
  setPreview(text: string, clock: string): void;
  /** Watch worn on this site or taken off (chip grays out, stays clickable). */
  setWorn(worn: boolean): void;
  /** Chip size from the Workshop: s / m / l. */
  setSize(size: PastilleSize): void;
  /** Dress the chip in the chosen dial's tokens. */
  setDial(dial: DialId): void;
  /** Interface language of the pastille texts. */
  setLocale(locale: UiLocale): void;
  /** Show or hide the one-time first-gift bubble. */
  setGiftVisible(visible: boolean): void;
  /** One 200ms tick animation when a message leaves with its context. */
  tick(): void;
  reposition(anchor: HTMLElement): void;
  destroy(): void;
}

const STYLE = `
  :host { all: initial; }
  .chip {
    position: fixed;
    z-index: 2147483000;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    box-shadow:
      0 3px 8px rgba(28, 25, 23, 0.22),
      0 1px 2px rgba(28, 25, 23, 0.14),
      inset 0 1px 0 rgba(255,255,255,0.35);
    transition: transform 0.2s ease;
    font-weight: 500;
    font-size: 11.5px;
    line-height: 1.4;
    letter-spacing: 0.01em;
  }
  .chip:focus-visible, .action:focus-visible, .workshop-link:focus-visible,
  .gift-main:focus-visible, .gift-close:focus-visible {
    outline: 2px solid #f97316;
    outline-offset: 2px;
  }
  .chip.tick { transform: rotate(12deg); }
  @media (prefers-reduced-motion: no-preference) {
    .chip { animation: chip-arrive 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
  }
  @keyframes chip-arrive {
    from { transform: translateY(-16px) scale(0.82); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  .chip.size-s { font-size: 10px; padding: 3px 8px; }
  .chip.size-l { font-size: 13.5px; padding: 6px 13px; }
  .chip.off { filter: grayscale(1) opacity(0.6); }
  .chip-crown {
    width: 3px;
    height: 9px;
    border-radius: 2px;
    flex: none;
  }
  .panel {
    position: fixed;
    z-index: 2147483000;
    max-width: 340px;
    padding: 10px 12px;
    border-radius: 10px;
    border-top: 2px solid transparent;
    background: rgba(28, 28, 30, 0.95);
    color: #f5f5f4;
    font: 400 11.5px/1.5 ui-monospace, monospace;
    white-space: pre-wrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    display: none;
  }
  .panel.open { display: block; }
  .panel .hint { margin-top: 8px; opacity: 0.55; font-family: ui-sans-serif, system-ui, sans-serif; white-space: normal; }
  .action {
    display: block;
    margin-top: 10px;
    padding: 5px 10px;
    border: 1px solid rgba(245,245,244,0.3);
    border-radius: 6px;
    background: none;
    color: #f5f5f4;
    font: 500 11px/1.3 ui-sans-serif, system-ui, sans-serif;
    cursor: pointer;
  }
  .action:hover { background: rgba(245,245,244,0.12); }
  .workshop-link {
    display: block;
    margin-top: 8px;
    background: none;
    border: none;
    padding: 0;
    color: rgba(245,245,244,0.6);
    font: 500 10.5px/1.3 ui-sans-serif, system-ui, sans-serif;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .workshop-link:hover { color: #f5f5f4; }
  .gift {
    position: fixed;
    z-index: 2147483000;
    display: none;
    align-items: center;
    gap: 8px;
    padding: 6px 6px 6px 12px;
    border-radius: 999px;
    border: 1px solid;
    font: 500 11.5px/1.3 ui-sans-serif, system-ui, sans-serif;
    box-shadow: 0 3px 10px rgba(28,25,23,0.25);
    animation: gift-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .gift.on { display: inline-flex; }
  .gift-main { background: none; border: none; padding: 0; color: inherit; font: inherit; cursor: pointer; }
  .gift-close {
    background: none; border: none; padding: 0 6px; color: inherit;
    opacity: 0.5; cursor: pointer; font-size: 12px;
  }
  .gift-close:hover { opacity: 1; }
  @keyframes gift-in { from { transform: translateY(6px); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .gift { animation: none; } }
`;

export interface PastilleHandlers {
  onToggleWorn: () => void;
  onOpenWorkshop: () => void;
  onGiftAccept: () => void;
  onGiftDismiss: () => void;
}

export function createPastille(doc: Document, handlers: PastilleHandlers): Pastille {
  let t = makeT('en');
  const host = doc.createElement('div');
  host.setAttribute('data-montre', 'pastille');
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = doc.createElement('style');
  style.textContent = STYLE;

  const chip = doc.createElement('button');
  chip.className = 'chip';
  chip.setAttribute('aria-label', 'AI watch — context preview');
  chip.setAttribute('aria-haspopup', 'true');
  const mini = doc.createElement('span');
  mini.className = 'chip-watch';
  const label = doc.createElement('span');
  label.className = 'chip-label';
  const crown = doc.createElement('span');
  crown.className = 'chip-crown';
  chip.append(mini, label, crown);

  const panel = doc.createElement('div');
  panel.className = 'panel';

  const gift = doc.createElement('div');
  gift.className = 'gift';
  const giftMain = doc.createElement('button');
  giftMain.className = 'gift-main';
  giftMain.textContent = t('giftBubble');
  const giftClose = doc.createElement('button');
  giftClose.className = 'gift-close';
  giftClose.textContent = '\u2715';
  giftClose.setAttribute('aria-label', 'Dismiss');
  gift.append(giftMain, giftClose);
  giftMain.addEventListener('click', (e) => {
    e.stopPropagation();
    gift.classList.remove('on');
    handlers.onGiftAccept();
  });
  giftClose.addEventListener('click', (e) => {
    e.stopPropagation();
    gift.classList.remove('on');
    handlers.onGiftDismiss();
  });

  shadow.append(style, chip, panel, gift);
  doc.body.appendChild(host);

  let preview = '';
  let worn = true;
  let clockLabel = '';
  let currentDial: DialId = 'studio';

  /** A true miniature of the chosen dial, hands set to the real time. */
  function drawMini(clock: string): void {
    const t = DIAL_TOKENS[currentDial];
    const m = /^(\d{1,2}):(\d{2})/.exec(clock);
    const hh = m ? Number(m[1]) % 12 : 10;
    const mm = m ? Number(m[2]) : 9;
    const hourA = hh * 30 + mm * 0.5;
    const minA = mm * 6;
    mini.innerHTML =
      `<svg viewBox="0 0 20 20" width="1.5em" height="1.5em" style="display:block">` +
      `<circle cx="10" cy="10" r="9" fill="${t.face}" stroke="${t.chipBorder}" stroke-width="1.4"/>` +
      `<line x1="10" y1="10" x2="10" y2="5.6" stroke="${t.hour}" stroke-width="1.7" stroke-linecap="round" transform="rotate(${hourA} 10 10)"/>` +
      `<line x1="10" y1="10" x2="10" y2="3.6" stroke="${t.minute}" stroke-width="1.2" stroke-linecap="round" transform="rotate(${minA} 10 10)"/>` +
      `<line x1="10" y1="11.5" x2="10" y2="3.2" stroke="${t.second}" stroke-width="0.6" transform="rotate(${(minA + 202) % 360} 10 10)"/>` +
      `<circle cx="10" cy="10" r="0.9" fill="${t.hour}"/>` +
      `</svg>`;
  }

  chip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  function applyDial(dial: DialId): void {
    currentDial = dial;
    const t = DIAL_TOKENS[dial];
    chip.style.background = t.chipBg;
    chip.style.color = t.chipFg;
    chip.style.fontFamily = t.chipFont;
    chip.style.border = `1px solid ${t.chipBorder}`;
    gift.style.background = t.chipBg;
    gift.style.color = t.chipFg;
    gift.style.borderColor = t.chipAccent;
    crown.style.background = `repeating-linear-gradient(to bottom, ${t.chipAccent} 0 2px, ${t.chipFg} 2px 3px)`;
    panel.style.borderTopColor = t.chipAccent;
    drawMini(clockLabel);
  }
  applyDial('studio');

  return {
    setPreview(text: string, clock: string) {
      preview = text;
      clockLabel = clock;
      label.textContent = worn ? clock : t('off');
      drawMini(clock);
      panel.textContent = worn ? preview : t('watchOffSite');
      if (worn) {
        const hint = doc.createElement('div');
        hint.className = 'hint';
        hint.textContent = t('carryTime');
        panel.appendChild(hint);
      }
      const action = doc.createElement('button');
      action.className = 'action';
      action.textContent = worn ? t('takeOffHere') : t('putBackOn');
      action.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('open');
        handlers.onToggleWorn();
      });
      panel.appendChild(action);
      const workshop = doc.createElement('button');
      workshop.className = 'workshop-link';
      workshop.textContent = t('enterWorkshop');
      workshop.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('open');
        handlers.onOpenWorkshop();
      });
      panel.appendChild(workshop);
      if (worn) {
        const giftAgain = doc.createElement('button');
        giftAgain.className = 'workshop-link';
        giftAgain.textContent = t('giftAgain');
        giftAgain.addEventListener('click', (e) => {
          e.stopPropagation();
          panel.classList.remove('open');
          handlers.onGiftAccept();
        });
        panel.appendChild(giftAgain);
      }
    },
    setWorn(w: boolean) {
      worn = w;
      chip.classList.toggle('off', !worn);
      label.textContent = worn ? clockLabel : t('off');
    },
    setSize(size: PastilleSize) {
      chip.classList.toggle('size-s', size === 's');
      chip.classList.toggle('size-l', size === 'l');
    },
    setDial(dial: DialId) {
      applyDial(dial);
    },
    setLocale(locale: UiLocale) {
      t = makeT(locale);
      giftMain.textContent = t('giftBubble');
    },
    setGiftVisible(visible: boolean) {
      gift.classList.toggle('on', visible);
    },
    tick() {
      panel.classList.remove('open');
      chip.classList.add('tick');
      setTimeout(() => chip.classList.remove('tick'), 200);
    },
    reposition(anchor: HTMLElement) {
      // Top-LEFT of the composer: the quiet corner (send controls live right).
      const r = anchor.getBoundingClientRect();
      chip.style.left = `${Math.max(8, r.left)}px`;
      chip.style.top = `${r.top - 30}px`;
      gift.style.left = `${Math.max(8, r.left)}px`;
      gift.style.top = `${r.top - 66}px`;
      panel.style.left = `${Math.max(8, r.left)}px`;
      panel.style.bottom = `${Math.max(8, window.innerHeight - r.top + 36)}px`;
      panel.style.top = 'auto';
    },
    destroy() {
      host.remove();
    },
  };
}
