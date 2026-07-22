<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import Watch from '../../components/Watch.svelte';
  import { BRAND } from '../../shared/brand';
  import { GIFT_PROMPT } from '../../shared/gift';
  import { loadSettings } from '../../shared/storage';
  import { renderFullBlock } from '../../core/template-renderer';
  import { DIAL_TOKENS } from '../../shared/dials';
  import {
    defaultSettings,
    DIAL_IDS,
    type DialId,
    type Settings,
    type UiLanguage,
  } from '../../core/settings';
  import { LOCALE_NAMES, UI_LOCALES } from '../../shared/i18n';
  import { makeT, resolveLocale } from '../../shared/i18n';

  let settings: Settings = $state(defaultSettings());
  let screen = $state(0); // 0 box · 1 dial · 2 proof · 3 gift
  let now = $state(new Date());
  let boxOpening = $state(false);
  let copied = $state(false);
  let serial = $state('');
  let offeredAt = $state('');

  /** 10:09:35 — the classic pose of watchmaking photography. */
  const SHOWCASE = new Date(2026, 0, 1, 10, 9, 35);

  const t = $derived(makeT(resolveLocale(settings.uiLanguage, navigator.language)));
  const DIAL_LINES = $derived<Record<DialId, string>>({
    heritage: t('dialHeritage'),
    studio: t('dialStudio'),
    lab: t('dialLab'),
  });

  onMount(() => {
    void (async () => {
      settings = await loadSettings();
      const stored = await browser.storage.local.get('certificate');
      const cert = stored['certificate'] as { serial: string; offeredAt: string } | undefined;
      if (cert) {
        serial = cert.serial;
        offeredAt = cert.offeredAt;
      } else {
        const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1000000;
        serial = `No. ${new Date().getFullYear()}\u00B7${String(n).padStart(6, '0')}`;
        offeredAt = new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date());
        await browser.storage.local.set({ certificate: { serial, offeredAt } });
      }
    })();
    const interval = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(interval);
  });

  function unbox(): void {
    boxOpening = true;
    setTimeout(() => (screen = 1), 1400);
  }

  async function setUiLanguage(v: UiLanguage): Promise<void> {
    settings.uiLanguage = v;
    await browser.storage.local.set({ settings: $state.snapshot(settings) });
  }

  const AI_EXITS: Array<[string, string]> = [
    ['ChatGPT', 'https://chatgpt.com'],
    ['Claude', 'https://claude.ai'],
    ['Gemini', 'https://gemini.google.com'],
    ['Mistral', 'https://chat.mistral.ai'],
    ['Perplexity', 'https://www.perplexity.ai'],
    ['Grok', 'https://grok.com'],
  ];

  async function pickDial(d: DialId): Promise<void> {
    settings.dial = d;
    await browser.storage.local.set({ settings: $state.snapshot(settings) });
  }

  const proofBlock = $derived(
    renderFullBlock({
      settings: $state.snapshot(settings),
      now,
      elapsedMs: null,
      sessionMs: 0,
    }),
  );

  async function copyPrompt(): Promise<void> {
    await navigator.clipboard.writeText(GIFT_PROMPT[settings.injection.blockLanguage]);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function frameCertificate(): Promise<void> {
    const t = DIAL_TOKENS[settings.dial];
    const GOLD = '#a8863c';
    const INK = '#1c1917';
    const monogram = new Image();
    monogram.src = '/monogram.png';
    await new Promise((resolve) => {
      monogram.onload = resolve;
      monogram.onerror = resolve;
    });

    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 800;
    const g = c.getContext('2d')!;
    g.fillStyle = '#faf8f2';
    g.fillRect(0, 0, 1200, 800);

    // double frame, hairline inside
    g.strokeStyle = GOLD;
    g.lineWidth = 3;
    g.strokeRect(36, 36, 1128, 728);
    g.lineWidth = 1;
    g.strokeRect(48, 48, 1104, 704);
    // corner marks
    g.lineWidth = 2;
    for (const [x, y, dx, dy] of [
      [60, 60, 1, 1],
      [1140, 60, -1, 1],
      [60, 740, 1, -1],
      [1140, 740, -1, -1],
    ] as Array<[number, number, number, number]>) {
      g.beginPath();
      g.moveTo(x + dx * 26, y);
      g.lineTo(x, y);
      g.lineTo(x, y + dy * 26);
      g.stroke();
    }

    // monogram (black on white → multiply blends onto cream)
    if (monogram.width > 0) {
      const mw = 220;
      const mh = (monogram.height / monogram.width) * mw;
      g.globalCompositeOperation = 'multiply';
      g.drawImage(monogram, 600 - mw / 2, 78, mw, mh);
      g.globalCompositeOperation = 'source-over';
    }

    g.textAlign = 'center';
    g.fillStyle = INK;
    g.font = '400 52px Georgia';
    g.fillText('Certificate', 600, 320);
    // gold rule
    g.strokeStyle = GOLD;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(480, 344);
    g.lineTo(720, 344);
    g.stroke();
    g.fillStyle = '#57534e';
    g.font = 'italic 400 23px Georgia';
    g.fillText('This certifies that an AI was given a watch.', 600, 390);

    // the dial
    g.beginPath();
    g.arc(600, 500, 74, 0, Math.PI * 2);
    g.fillStyle = t.caseColor;
    g.fill();
    g.beginPath();
    g.arc(600, 500, 67, 0, Math.PI * 2);
    g.fillStyle = t.face;
    g.fill();
    g.strokeStyle = t.hour;
    g.lineCap = 'round';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(600, 500);
    g.lineTo(600 + 37 * Math.sin(5.76), 500 - 37 * Math.cos(5.76));
    g.stroke();
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(600, 500);
    g.lineTo(600 + 53 * Math.sin(0.94), 500 - 53 * Math.cos(0.94));
    g.stroke();
    g.strokeStyle = t.second;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(600, 500);
    g.lineTo(600 + 58 * Math.sin(3.67), 500 - 58 * Math.cos(3.67));
    g.stroke();

    g.fillStyle = INK;
    g.font = '400 30px Georgia';
    g.fillText(`${t.name} Collection`, 600, 630);
    g.fillStyle = '#57534e';
    g.font = '400 22px Georgia';
    g.fillText(offeredAtLine(), 600, 668);
    g.fillStyle = GOLD;
    g.font = '400 17px system-ui';
    const sp = `${serial}  ·  Calibre 1.0`;
    g.fillText(sp.toUpperCase(), 600, 706);
    g.fillStyle = '#a8a29e';
    g.font = '400 15px system-ui';
    g.fillText('Nothing leaves your computer. Ever.', 600, 740);

    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'your-watch-certificate.png';
    a.click();
  }

  function offeredAtLine(): string {
    return `${t('offeredOn')} ${offeredAt}`;
  }
</script>

<main>
  <div class="lang-corner">
    <select
      value={settings.uiLanguage}
      onchange={(e) => void setUiLanguage((e.currentTarget as HTMLSelectElement).value as UiLanguage)}
      aria-label={t('uiLanguage')}
    >
      <option value="auto">Auto</option>
      {#each UI_LOCALES as l (l)}
        <option value={l}>{LOCALE_NAMES[l]}</option>
      {/each}
    </select>
  </div>
  <img class="maison" src="/monogram.png" alt="" />
  {#if screen === 0}
    <section class="stage">
      <div class="boxphoto" class:opening={boxOpening}>
        <img class="closed" src="/box-closed.webp" alt="" />
        <img class="open" src="/box-open.webp" alt="" />
      </div>
      <h1>{t('gaveWatch')}</h1>
      <button class="primary" onclick={unbox}>{t('unboxIt')}</button>
    </section>
  {:else if screen === 1}
    <section class="stage">
      <p class="eyebrow">{t('theCollection')}</p>
      <h1>{t('chooseDial')}</h1>
      <div class="dials">
        {#each DIAL_IDS as d, i (d)}
          <button
            class="dial-card"
            class:chosen={settings.dial === d}
            style="animation-delay: {i * 0.12}s"
            onclick={() => void pickDial(d)}
          >
            <Watch now={SHOWCASE} dial={d} size={124} />
            <span class="dial-name">{DIAL_TOKENS[d].name}</span>
            <span class="dial-line">{DIAL_LINES[d]}</span>
          </button>
        {/each}
      </div>
      <p class="note">{t('sameWatch')}</p>
      <button class="primary" onclick={() => (screen = 2)}>{t('cont')}</button>
    </section>
  {:else if screen === 2}
    <section class="stage">
      <p class="eyebrow">{t('thePromise')}</p>
      <h1>{t('readExact')}</h1>
      <pre class="proof">{proofBlock}</pre>
      <p class="note">{t('plansPublic')}</p>
      <button class="primary" onclick={() => (screen = 3)}>{t('cont')}</button>
    </section>
  {:else}
    <section class="stage">
      <p class="eyebrow">{t('oneLastThing')}</p>
      <h1>{t('firstGift')}</h1>
      <p class="lede">{t('giftLede')}</p>
      <blockquote class="gift-words">{GIFT_PROMPT[settings.injection.blockLanguage]}</blockquote>
      <p class="open-now">{t('openNow')}</p>
      <div class="exits">
        {#each AI_EXITS as [name, url] (name)}
          <a class="exit" href={url} target="_blank" rel="noopener">{name}</a>
        {/each}
      </div>
      <div class="row">
        <button class="linklike" onclick={() => void copyPrompt()}>
          {copied ? t('copied') : t('copyGift')}
        </button>
        <button class="linklike" onclick={() => void frameCertificate()}>{t('frameCert')}</button>
      </div>
      <div class="cert">
        <img class="cert-mono" src="/monogram.png" alt="" />
        <Watch {now} dial={settings.dial} size={72} />
        <p class="cert-line">
          {DIAL_TOKENS[settings.dial].name} Collection · {t('offeredOn')} {offeredAt}
        </p>
        <p class="cert-serial">{serial} · Calibre 1.0</p>
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #faf9f7;
  }

  :global(button:focus-visible),
  :global(a:focus-visible),
  :global(select:focus-visible),
  :global(input:focus-visible),
  :global(textarea:focus-visible) {
    outline: 2px solid #1c1917;
    outline-offset: 2px;
    border-radius: 4px;
  }
  main {
    min-height: 100vh;
    display: grid;
    place-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    color: #1c1917;
  }
  .stage {
    text-align: center;
    max-width: 720px;
    padding: 48px 32px;
    animation: fade-in 0.5s ease;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  h1 {
    font-family: Georgia, serif;
    font-weight: 400;
    font-size: 32px;
    margin: 18px 0 26px;
  }
  .eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #a8a29e;
  }
  .lede {
    color: #57534e;
    font-size: 14.5px;
    max-width: 52ch;
    margin: 0 auto 18px;
  }
  .note {
    color: #a8a29e;
    font-size: 12.5px;
    margin: 18px 0 26px;
  }
  .primary {
    padding: 11px 30px;
    border: none;
    border-radius: 999px;
    background: #1c1917;
    color: #fafaf9;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .primary:hover {
    transform: translateY(-1px);
  }
  .linklike {
    border: none;
    background: none;
    font-size: 13px;
    color: #78716c;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .linklike:hover {
    color: #1c1917;
  }
  .maison {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: 104px;
    mix-blend-mode: multiply;
    pointer-events: none;
  }
  .lang-corner {
    position: fixed;
    top: 18px;
    right: 22px;
  }
  .lang-corner select {
    padding: 6px 10px;
    border: 1px solid #d6d3d1;
    border-radius: 8px;
    background: #fff;
    font-size: 12px;
    color: #57534e;
    cursor: pointer;
  }
  .open-now {
    margin: 0 0 10px;
    font-size: 12.5px;
    color: #78716c;
  }
  .exits {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 34px;
  }
  .exit {
    padding: 7px 16px;
    border: 1px solid #d6d3d1;
    border-radius: 999px;
    background: #fff;
    color: #1c1917;
    font-size: 12.5px;
    text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .exit:hover {
    border-color: #1c1917;
    transform: translateY(-1px);
  }
  /* the box — the real one */
  .boxphoto {
    position: relative;
    width: 340px;
    height: 400px;
    margin: 0 auto 6px;
  }
  .boxphoto img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* Product-shot trick: baked white background melts into the page,
       soft shadows blend naturally. */
    mix-blend-mode: multiply;
    transition: opacity 0.9s ease, transform 1.1s ease;
  }
  .boxphoto .open {
    opacity: 0;
    transform: scale(0.985);
  }
  .boxphoto.opening .closed {
    opacity: 0;
    transform: scale(1.015);
  }
  .boxphoto.opening .open {
    opacity: 1;
    transform: scale(1);
  }
  @media (prefers-reduced-motion: reduce) {
    .boxphoto img {
      transition: opacity 0.3s ease;
    }
  }
  /* dials */
  .dials {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin: 8px 0 4px;
  }
  .dial-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 18px 18px;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 16px;
    cursor: pointer;
    width: 190px;
    animation: fade-in 0.5s ease backwards;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }
  .dial-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(28, 25, 23, 0.1);
  }
  .dial-card.chosen {
    border-color: #1c1917;
    box-shadow: 0 0 0 1px #1c1917;
  }
  .dial-name {
    font-family: Georgia, serif;
    font-size: 17px;
  }
  .dial-line {
    font-size: 11.5px;
    color: #78716c;
  }
  /* proof */
  .proof {
    margin: 0 auto 6px;
    padding: 18px 22px;
    max-width: 46ch;
    text-align: left;
    font: 13px/1.7 ui-monospace, monospace;
    background: #1c1917;
    color: #e7e5e4;
    border-radius: 12px;
    white-space: pre-wrap;
  }
  /* gift */
  .gift-words {
    margin: 0 auto 22px;
    padding: 16px 22px;
    max-width: 56ch;
    font-family: Georgia, serif;
    font-size: 15.5px;
    font-style: italic;
    color: #44403c;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 12px;
  }
  .row {
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;
    margin-bottom: 34px;
  }
  .cert {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 22px 34px;
    background: #fff;
    border: 1px solid #e0dbd2;
    border-radius: 14px;
  }
  .cert-mono {
    width: 92px;
    mix-blend-mode: multiply;
    margin-bottom: 2px;
  }
  .cert-line {
    margin: 6px 0 0;
    font-family: Georgia, serif;
    font-size: 14px;
  }
  .cert-serial {
    margin: 0;
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #a8a29e;
  }
</style>
