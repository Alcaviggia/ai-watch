<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { BRAND } from '../../shared/brand';
  import Watch from '../../components/Watch.svelte';
  import { loadSettings } from '../../shared/storage';
  import { SITE_NAMES } from '../../adapters/resolver';
  import { renderCustomTemplate, renderFullBlock, renderCompact } from '../../core/template-renderer';
  import {
    defaultSettings,
    DIAL_IDS,
    type DialId,
    type PastilleSize,
    type Settings,
    type UiLanguage,
  } from '../../core/settings';
  import { LOCALE_NAMES, makeT, resolveLocale, UI_LOCALES } from '../../shared/i18n';

  let settings: Settings = $state(defaultSettings());
  let loaded = $state(false);
  let now = $state(new Date());
  /** 10:09:35 — the classic pose of watchmaking photography. */
  const SHOWCASE = new Date(2026, 0, 1, 10, 9, 35);
  let section = $state('collections');
  let templateDraft = $state('');
  let timesTotal = $state(0);

  const DEFAULT_TEMPLATE = [
    'Current context',
    'Date: {weekday} {date}',
    'Time: {time}',
    'Timezone: {timezone}',
    'ISO Week: {isoWeek}',
    'Elapsed since previous message: {elapsed}',
    'Current session: {session}',
    'Season: {season}',
    'Time of day: {timeOfDay}',
    'Moon phase: {moonPhase}',
    'Use this information whenever it is relevant.',
  ].join('\n');

  const TOKENS = [
    'date',
    'weekday',
    'time',
    'timezone',
    'isoWeek',
    'elapsed',
    'session',
    'season',
    'timeOfDay',
    'moonPhase',
  ];

  const t = $derived(makeT(resolveLocale(settings.uiLanguage, navigator.language)));
  const SECTIONS = $derived([
    { id: 'collections', name: 'Collections', line: t('navCollections') },
    { id: 'gravure', name: 'Gravure', line: t('navGravure') },
    { id: 'wrists', name: 'Wrists', line: t('navWrists') },
    { id: 'remontoir', name: 'Remontoir', line: t('navRemontoir') },
    { id: 'transparence', name: 'Transparence', line: t('navTransparence') },
    { id: 'langues', name: t('langSection'), line: t('langSectionLine') },
  ]);

  const DIAL_INFO = $derived<Record<DialId, { name: string; line: string }>>({
    heritage: { name: 'Heritage', line: t('dialHeritage') },
    studio: { name: 'Studio', line: t('dialStudio') },
    lab: { name: 'Lab', line: t('dialLab') },
  });

  onMount(() => {
    void (async () => {
      settings = await loadSettings();
      templateDraft = settings.injection.customTemplate ?? DEFAULT_TEMPLATE;
      const all = await browser.storage.local.get(null);
      timesTotal = Object.entries(all)
        .filter(([k]) => k.startsWith('wrist:'))
        .reduce((sum, [, v]) => sum + ((v as { promptCount?: number })?.promptCount ?? 0), 0);
      loaded = true;
    })();
    const interval = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(interval);
  });

  async function save(): Promise<void> {
    await browser.storage.local.set({ settings: $state.snapshot(settings) });
  }

  function pickDial(d: DialId): void {
    settings.dial = d;
    void save();
  }
  function pickSize(sz: PastilleSize): void {
    settings.pastilleSize = sz;
    void save();
  }

  let textareaEl: HTMLTextAreaElement | undefined = $state(undefined);
  function insertToken(token: string): void {
    const t = `{${token}}`;
    if (!textareaEl) {
      templateDraft += t;
      return;
    }
    const start = textareaEl.selectionStart ?? templateDraft.length;
    const end = textareaEl.selectionEnd ?? start;
    templateDraft = templateDraft.slice(0, start) + t + templateDraft.slice(end);
  }
  function saveEngraving(): void {
    settings.injection.customTemplate =
      templateDraft.trim() === DEFAULT_TEMPLATE.trim() ? null : templateDraft;
    void save();
  }
  function resetEngraving(): void {
    templateDraft = DEFAULT_TEMPLATE;
    settings.injection.customTemplate = null;
    void save();
  }

  const EXAMPLE = { elapsedMs: 12 * 60000, sessionMs: 103 * 60000 };
  const engravingPreview = $derived.by(() => {
    if (!loaded) return '';
    return renderCustomTemplate(templateDraft, {
      settings: $state.snapshot(settings),
      now: new Date(),
      ...EXAMPLE,
    });
  });
  const fullPreview = $derived.by(() => {
    if (!loaded) return '';
    return renderFullBlock({ settings: $state.snapshot(settings), now: new Date(), ...EXAMPLE });
  });
  const compactPreview = $derived.by(() => {
    if (!loaded) return '';
    return renderCompact({ settings: $state.snapshot(settings), now: new Date(), ...EXAMPLE });
  });

  const namedWrists = $derived(
    Object.entries(SITE_NAMES).map(([id, name]) => ({
      id,
      name,
      worn: settings.sites[id]?.enabled !== false,
    })),
  );
  const freeWrists = $derived(
    Object.keys(settings.sites)
      .filter((id) => SITE_NAMES[id] === undefined)
      .map((id) => ({ id, name: id, worn: settings.sites[id]?.enabled !== false })),
  );
  function toggleWrist(id: string): void {
    settings.sites[id] = { ...settings.sites[id], enabled: !(settings.sites[id]?.enabled !== false) };
    void save();
  }
  async function returnWatch(host: string): Promise<void> {
    try {
      await browser.scripting.unregisterContentScripts({ ids: [`wrist-${host}`] });
    } catch {
      /* already gone */
    }
    try {
      await browser.permissions.remove({ origins: [`https://${host}/*`, `http://${host}/*`] });
    } catch {
      /* not removable */
    }
    delete settings.sites[host];
    void save();
  }
</script>

<main>
  <header>
    <img class="maison" src="/monogram.png" alt={BRAND.name} />
    <h1>The Workshop</h1>
    <p class="welcome">{t('bench')}</p>
  </header>

  <section class="cushion-zone">
    <div class="watch-seat">
      <Watch {now} dial={settings.dial} size={216} />
      <div class="cushion"></div>
    </div>
    <p class="own-eyebrow">{t('yourWatch')}</p>
    <p class="own-dial">{DIAL_INFO[settings.dial].name} Collection</p>
    <p class="own-calibre">Calibre 1.0</p>
  </section>

  <div class="bench">
    <nav>
      {#each SECTIONS as s (s.id)}
        <button class="nav-item" class:active={section === s.id} onclick={() => (section = s.id)}>
          <span class="nav-name">{s.name}</span>
          <span class="nav-line">{s.line}</span>
        </button>
      {/each}
    </nav>

    <div class="table">
      {#if section === 'collections'}
        <h2>Collections</h2>
        <p class="lede">{t('collectionsLede')}</p>
        <div class="dials">
          {#each DIAL_IDS as d (d)}
            <button class="dial-card" class:chosen={settings.dial === d} onclick={() => pickDial(d)}>
              <Watch now={SHOWCASE} dial={d} size={92} />
              <span class="dial-name">{DIAL_INFO[d].name}</span>
              <span class="dial-line">{DIAL_INFO[d].line}</span>
            </button>
          {/each}
        </div>

        <h3>{t('pastilleH')}</h3>
        <p class="lede">{t('pastilleLede')}</p>
        <div class="seg">
          {#each ['s', 'm', 'l'] as sz (sz)}
            <button
              class="seg-item"
              class:chosen={settings.pastilleSize === sz}
              onclick={() => pickSize(sz as PastilleSize)}
            >
              {sz.toUpperCase()}
            </button>
          {/each}
        </div>
      {:else if section === 'gravure'}
        <h2>Gravure</h2>
        <p class="lede">{t('gravureLede')}</p>
        <div class="chips">
          {#each TOKENS as t (t)}
            <button class="chip" onclick={() => insertToken(t)}>{'{' + t + '}'}</button>
          {/each}
        </div>
        <div class="engraving">
          <textarea bind:this={textareaEl} bind:value={templateDraft} rows="12" spellcheck="false"
          ></textarea>
          <pre class="preview">{engravingPreview}</pre>
        </div>
        <div class="row-actions">
          <button class="primary" onclick={saveEngraving}>{t('engrave')}</button>
          <button class="linklike" onclick={resetEngraving}>{t('returnEngraving')}</button>
        </div>
      {:else if section === 'wrists'}
        <h2>Wrists</h2>
        <p class="lede">{t('wristsLede')}</p>
        {#each namedWrists as w (w.id)}
          <div class="wrist">
            <span class="wrist-name">{w.name}</span>
            <span class="wrist-state">{w.worn ? t('wears') : t('takenOff')}</span>
            <button class="linklike" onclick={() => toggleWrist(w.id)}>
              {w.worn ? t('takeItOff') : t('putItBack')}
            </button>
          </div>
        {/each}
        {#if freeWrists.length > 0}
          <h3>{t('offeredByYou')}</h3>
          {#each freeWrists as w (w.id)}
            <div class="wrist">
              <span class="wrist-name">{w.name}</span>
              <span class="wrist-state">{w.worn ? t('wears') : t('takenOff')}</span>
              <button class="linklike" onclick={() => toggleWrist(w.id)}>
                {w.worn ? t('takeItOff') : t('putItBack')}
              </button>
              <button class="linklike danger" onclick={() => void returnWatch(w.id)}>
                {t('returnWatch')}
              </button>
            </div>
          {/each}
        {:else}
          <p class="note">{t('noOffered')}</p>
        {/if}
      {:else if section === 'remontoir'}
        <h2>Remontoir</h2>
        <p class="lede">{t('remontoirLede')}</p>
        <h3>{t('whenWrites')}</h3>
        <div class="choices">
          {#each [{ v: 'session-start', t: t('freqSessionT'), d: t('freqSessionD') }, { v: 'every-message', t: t('freqEveryT'), d: t('freqEveryD') }, { v: 'manual', t: t('freqManualT'), d: t('freqManualD') }] as opt (opt.v)}
            <label class="choice" class:chosen={settings.injection.frequency === opt.v}>
              <input
                type="radio"
                name="freq"
                checked={settings.injection.frequency === opt.v}
                onchange={() => {
                  settings.injection.frequency = opt.v as Settings['injection']['frequency'];
                  void save();
                }}
              />
              <span class="choice-t">{opt.t}</span>
              <span class="choice-d">{opt.d}</span>
            </label>
          {/each}
        </div>
        <h3>{t('theSession')}</h3>
        <label class="slider">
          {t('sessionEndsA')}
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            bind:value={settings.injection.sessionResetMinutes}
            onchange={() => void save()}
          />
          <strong>{settings.injection.sessionResetMinutes}</strong> {t('sessionEndsB')}
        </label>
        <label class="slider">
          {t('fullAgainA')}
          <input
            type="range"
            min="30"
            max="360"
            step="15"
            bind:value={settings.injection.fullBlockAfterMinutes}
            onchange={() => void save()}
          />
          <strong>{settings.injection.fullBlockAfterMinutes}</strong> {t('fullAgainB')}
        </label>
      {:else if section === 'transparence'}
        <h2>Transparence</h2>
        <p class="lede">{t('transparenceLede')}</p>
        <h3>{t('fullContextH')}</h3>
        <pre class="preview wide">{fullPreview}</pre>
        <h3>{t('discreetH')}</h3>
        <pre class="preview wide">{compactPreview}</pre>
        <div class="caseback">
          <p>{t('privacy')}</p>
          <p class="note">{t('verify')}</p>
          <p class="engraved">
            Calibre {BRAND.calibre} · {timesTotal === 1 ? t('timeTold1') : t('timeTold', { n: timesTotal })}
          </p>
        </div>
      {:else if section === 'langues'}
        <h2>{t('langSection')}</h2>
        <p class="lede">{t('langSectionLine')}</p>
        <h3>{t('uiLanguage')}</h3>

        <div class="seg">
          <button
            class="seg-item"
            class:chosen={settings.uiLanguage === 'auto'}
            onclick={() => {
              settings.uiLanguage = 'auto';
              void save();
            }}>Auto</button>
          {#each UI_LOCALES as l (l)}
            <button
              class="seg-item"
              class:chosen={settings.uiLanguage === l}
              onclick={() => {
                settings.uiLanguage = l as UiLanguage;
                void save();
              }}>{LOCALE_NAMES[l]}</button>
          {/each}
        </div>
        <h3>{t('engravingLang')}</h3>
        <div class="seg">
          {#each ['en', 'fr'] as l (l)}
            <button
              class="seg-item"
              class:chosen={settings.injection.blockLanguage === l}
              onclick={() => {
                settings.injection.blockLanguage = l as 'en' | 'fr';
                void save();
              }}
            >
              {l === 'en' ? 'English' : 'Français'}
            </button>
          {/each}
        </div>
        <p class="note">{t('engravingLangNote')}</p>
              {/if}
    </div>
  </div>
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
    max-width: 980px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #1c1917;
  }
  header {
    text-align: center;
    margin-bottom: 44px;
  }
  .maison {
    width: 128px;
    mix-blend-mode: multiply;
    margin: 0 auto;
    display: block;
  }
  h1 {
    margin: 8px 0 6px;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 400;
    font-size: 34px;
    letter-spacing: 0.01em;
  }
  .welcome {
    margin: 0;
    color: #78716c;
    font-size: 13.5px;
  }
  .cushion-zone {
    text-align: center;
    margin: 10px 0 64px;
  }
  .watch-seat {
    position: relative;
    display: inline-block;
    padding-bottom: 26px;
  }
  .watch-seat :global(.watch) {
    position: relative;
    z-index: 1;
  }
  .cushion {
    position: absolute;
    left: 50%;
    bottom: 6px;
    transform: translateX(-50%);
    width: 250px;
    height: 74px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 32%, #efe8da 0%, #e3d9c6 55%, #d7cbb2 100%);
    box-shadow:
      inset 0 -10px 18px rgba(120, 100, 70, 0.22),
      inset 0 6px 10px rgba(255, 255, 255, 0.55),
      0 14px 26px rgba(28, 25, 23, 0.14);
  }
  .own-eyebrow {
    margin: 4px 0 2px;
    font-size: 10.5px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #a8a29e;
  }
  .own-dial {
    margin: 0;
    font-family: Georgia, serif;
    font-size: 22px;
  }
  .own-calibre {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: #78716c;
  }
  .bench {
    display: grid;
    grid-template-columns: 210px 1fr;
    gap: 40px;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-right: 1px solid #e7e5e4;
    padding-right: 20px;
  }
  .nav-item {
    text-align: left;
    background: none;
    border: none;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
  }
  .nav-item:hover {
    background: #f5f4f2;
  }
  .nav-item.active {
    background: #1c1917;
  }
  .nav-item.active .nav-name,
  .nav-item.active .nav-line {
    color: #fafaf9;
  }
  .nav-name {
    display: block;
    font-family: Georgia, serif;
    font-size: 16px;
  }
  .nav-line {
    display: block;
    font-size: 11px;
    color: #a8a29e;
    margin-top: 2px;
  }
  h2 {
    font-family: Georgia, serif;
    font-weight: 400;
    font-size: 26px;
    margin: 0 0 6px;
  }
  h3 {
    font-family: Georgia, serif;
    font-weight: 400;
    font-size: 18px;
    margin: 48px 0 10px;
  }
  .lede {
    color: #78716c;
    font-size: 13.5px;
    margin: 0 0 22px;
    max-width: 56ch;
  }
  .note {
    color: #a8a29e;
    font-size: 12px;
    margin-top: 14px;
  }
  .dials {
    display: flex;
    gap: 18px;
  }
  .dial-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 22px 14px 18px;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .dial-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(28, 25, 23, 0.07);
  }
  .dial-card.chosen {
    border-color: #1c1917;
    box-shadow: 0 0 0 1px #1c1917;
  }
  .num {
    font: 9px Georgia, serif;
    fill: #57534e;
    text-anchor: middle;
  }
  .dial-name {
    font-family: Georgia, serif;
    font-size: 16px;
  }
  .dial-line {
    font-size: 11.5px;
    color: #78716c;
    text-align: center;
  }
  .seg {
    display: inline-flex;
    border: 1px solid #d6d3d1;
    border-radius: 999px;
    overflow: hidden;
  }
  .seg-item {
    border: none;
    background: none;
    padding: 7px 18px;
    font-size: 12.5px;
    cursor: pointer;
  }
  .seg-item.chosen {
    background: #1c1917;
    color: #fafaf9;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .chip {
    border: 1px solid #d6d3d1;
    background: #fff;
    border-radius: 999px;
    padding: 4px 10px;
    font: 11.5px ui-monospace, monospace;
    cursor: pointer;
  }
  .chip:hover {
    border-color: #1c1917;
  }
  .engraving {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  textarea {
    font: 12px/1.6 ui-monospace, monospace;
    padding: 14px;
    border: 1px solid #d6d3d1;
    border-radius: 10px;
    resize: vertical;
    background: #fff;
  }
  .preview {
    margin: 0;
    padding: 14px;
    font: 12px/1.6 ui-monospace, monospace;
    background: #1c1917;
    color: #e7e5e4;
    border-radius: 10px;
    white-space: pre-wrap;
  }
  .preview.wide {
    max-width: 60ch;
  }
  .row-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 14px;
  }
  .primary {
    padding: 9px 22px;
    border: none;
    border-radius: 999px;
    background: #1c1917;
    color: #fafaf9;
    font-size: 13px;
    cursor: pointer;
  }
  .linklike {
    border: none;
    background: none;
    padding: 0;
    font-size: 12px;
    color: #78716c;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .linklike:hover {
    color: #1c1917;
  }
  .linklike.danger:hover {
    color: #b91c1c;
  }
  .wrist {
    display: flex;
    align-items: baseline;
    gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid #eeedeb;
  }
  .wrist-name {
    font-size: 14px;
    min-width: 130px;
  }
  .wrist-state {
    flex: 1;
    font-size: 12px;
    color: #78716c;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .choice {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 10px;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid #e7e5e4;
    border-radius: 10px;
    cursor: pointer;
  }
  .choice.chosen {
    border-color: #1c1917;
  }
  .choice-t {
    font-size: 13.5px;
  }
  .choice-d {
    grid-column: 2;
    font-size: 12px;
    color: #78716c;
  }
  .choice input {
    accent-color: #1c1917;
  }
  .slider {
    display: block;
    font-size: 13px;
    margin: 14px 0;
    color: #44403c;
  }
  .slider input {
    display: block;
    width: 320px;
    margin: 8px 0 4px;
    accent-color: #1c1917;
  }
  .caseback {
    margin-top: 36px;
    padding: 22px;
    border: 1px solid #e7e5e4;
    border-radius: 14px;
    background: #fff;
    text-align: center;
  }
  .caseback p:first-child {
    font-family: Georgia, serif;
    font-size: 16px;
    margin: 0 0 8px;
  }
  .engraved {
    margin: 18px 0 0;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #a8a29e;
  }
</style>
