<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import Watch from '../../components/Watch.svelte';
  import { DIAL_TOKENS } from '../../shared/dials';
  import { BRAND } from '../../shared/brand';
  import { loadSettings, loadWrist } from '../../shared/storage';
  import { knownSiteId, SITE_NAMES } from '../../adapters/resolver';
  import { COMPLICATIONS, COMPLICATION_ORDER } from '../../core/complications/registry';
  import type { ComplicationContext } from '../../core/complications/types';
  import { buildPreview, liveSession } from '../../core/preview';
  import { defaultSettings, type ComplicationId, type Settings } from '../../core/settings';
  import { makeT, resolveLocale } from '../../shared/i18n';
  import { initialWristState, type WristState } from '../../core/session-tracker';

  let settings: Settings = $state(defaultSettings());
  let wrist: WristState = $state(initialWristState());
  let now = $state(new Date());
  /** Frozen instant shown while the crown is pulled. */
  let frozenAt: Date | null = $state(null);
  let siteId: string | null = $state(null);
  let siteName: string | null = $state(null);
  /** Current tab info for the Free Wrist offer. */
  let tabOrigin: string | null = $state(null);
  let tabHost: string | null = $state(null);
  let tabId: number | null = $state(null);
  let offerBusy = $state(false);
  let wristStatus: { found: boolean; at: number } | null = $state(null);
  let previewOpen = $state(false);
  let loaded = $state(false);
  /** ms behind real time during the opening wind-up animation. */
  let windOffset = $state(0);
  let introPulse = $state(false);

  onMount(() => {
    void (async () => {
      settings = await loadSettings();
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            tabOrigin = url.origin;
            tabHost = url.hostname;
            tabId = tab.id ?? null;
          }
          const host = url.hostname;
          const id = knownSiteId(host) ?? (settings.sites[host] ? host : null);
          if (id) {
            siteId = id;
            siteName = SITE_NAMES[id] ?? id;
            wrist = await loadWrist(id);
            const st = await browser.storage.local.get(`wrist-status:${id}`);
            wristStatus =
              (st[`wrist-status:${id}`] as { found: boolean; at: number } | undefined) ?? null;
          }
        } catch {
          /* chrome:// pages etc. — no site context */
        }
      }
      loaded = true;
    })();
    document.title = BRAND.name;
    // One-time crown welcome pulse (per install, not per open).
    try {
      if (!localStorage.getItem('crown-intro-shown')) {
        introPulse = true;
        localStorage.setItem('crown-intro-shown', '1');
      }
    } catch {
      /* storage may be unavailable; skip the pulse */
    }
    // Wind-up: hands catch up to real time on open (validated design).
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const from = -18 * 60000;
      windOffset = from;
      const start = performance.now();
      const duration = DIAL_TOKENS[settings.dial]?.windMs ?? 450;
      const step = (t: number): void => {
        const progress = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        windOffset = from * (1 - eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    const interval = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(interval);
  });

  const displayedNow = $derived(frozenAt ?? new Date(now.getTime() + windOffset));
  const t = $derived(makeT(resolveLocale(settings.uiLanguage, navigator.language)));
  const C_KEYS: Record<ComplicationId, string> = {
    date: 'cDate',
    weekday: 'cWeekday',
    clock: 'cClock',
    timezone: 'cTimezone',
    isoWeek: 'cIsoWeek',
    chronograph: 'cChronograph',
    session: 'cSession',
    season: 'cSeason',
    timeOfDay: 'cTimeOfDay',
    moonPhase: 'cMoonPhase',
  };
  const running = $derived(settings.crownRunning);

  const siteEnabled = $derived(siteId !== null && settings.sites[siteId]?.enabled !== false);

  const liveCtx = $derived.by((): ComplicationContext => {
    const live = liveSession(
      $state.snapshot(wrist),
      now.getTime(),
      settings.injection.sessionResetMinutes,
    );
    return {
      now,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: 'en',
      elapsedMs: live.elapsedMs,
      sessionMs: live.sessionMs,
    };
  });

  const previewText = $derived(
    buildPreview($state.snapshot(settings), $state.snapshot(wrist), now.getTime()).text,
  );

  async function save(): Promise<void> {
    await browser.storage.local.set({ settings: $state.snapshot(settings) });
  }

  function toggleCrown(): void {
    settings.crownRunning = !settings.crownRunning;
    frozenAt = settings.crownRunning ? null : new Date();
    void save();
  }

  function toggleComplication(id: ComplicationId): void {
    settings.complications[id] = !settings.complications[id];
    void save();
  }

  function toggleSite(): void {
    if (!siteId) return;
    settings.sites[siteId] = { enabled: !siteEnabled };
    void save();
  }

  async function offerWatch(): Promise<void> {
    if (!tabOrigin || !tabHost) return;
    offerBusy = true;
    try {
      const granted = await browser.permissions.request({ origins: [`${tabOrigin}/*`] });
      if (!granted) return;
      const scriptId = `wrist-${tabHost}`;
      const registration = {
        id: scriptId,
        js: ['content-scripts/watch.js'],
        matches: [`${tabOrigin}/*`],
        persistAcrossSessions: true,
        runAt: 'document_idle' as const,
      };
      try {
        await browser.scripting.registerContentScripts([registration]);
      } catch {
        await browser.scripting.updateContentScripts([registration]);
      }
      settings.sites[tabHost] = { enabled: true };
      await save();
      siteId = tabHost;
      siteName = tabHost;
      if (tabId !== null) await browser.tabs.reload(tabId);
    } finally {
      offerBusy = false;
    }
  }

  const wristStopped = $derived(
    siteId !== null &&
      settings.sites[siteId]?.everWorked === true &&
      wristStatus !== null &&
      !wristStatus.found,
  );
  const wristUnfamiliar = $derived(
    siteId !== null &&
      SITE_NAMES[siteId] === undefined &&
      settings.sites[siteId]?.everWorked !== true,
  );

  function liveValue(id: ComplicationId): string {
    return COMPLICATIONS[id].value(liveCtx) ?? '—';
  }
</script>

<main>
  <section class="dial-zone">
    <Watch now={displayedNow} dial={settings.dial} {running} {introPulse} showCrown={true} oncrown={toggleCrown} />
    {#if !running}
      <p class="status stopped-msg">{t('watchStopped')}</p>
    {:else if siteName}
      {#if wristStopped}
        <p class="status warn">{t('wristStopped1')}</p>
        <p class="status muted">{t('wristStopped2')}</p>
      {:else if wristUnfamiliar}
        <p class="status warn">{t('unfamiliar1')}</p>
        <p class="status muted">{t('unfamiliar2')}</p>
      {:else}
        <p class="status">
          {#if siteEnabled}{siteName} {t('wearsWatch')} <span class="ok">✓</span>
          {:else}{siteName} {t('notWearing')}{/if}
        </p>
      {/if}
      <button class="linklike" onclick={toggleSite}>
        {siteEnabled ? t('takeOffHere') : t('putBackOn')}
      </button>
    {:else if tabOrigin}
      <p class="status">{BRAND.tagline.en}</p>
      <button class="offer" onclick={() => void offerWatch()} disabled={offerBusy}>
        {offerBusy ? t('offering') : t('offerWatch')}
      </button>
      <p class="status muted">{t('adaptsItself')}</p>
    {:else}
      <p class="status">{BRAND.tagline.en}</p>
      <p class="status muted">{t('watchWaiting')}</p>
    {/if}
  </section>

  {#if loaded}
    <section class="complications" class:inert-zone={!running}>
      {#each COMPLICATION_ORDER as id (id)}
        <label class="row" class:off={!settings.complications[id]}>
          <span class="label">{t(C_KEYS[id])}</span>
          <span class="value">{settings.complications[id] ? liveValue(id) : ''}</span>
          <input
            type="checkbox"
            checked={settings.complications[id]}
            onchange={() => toggleComplication(id)}
          />
        </label>
      {/each}
    </section>

    <section class="footer" class:inert-zone={!running}>
      <button class="linklike" onclick={() => (previewOpen = !previewOpen)}>
        {previewOpen ? t('hideSent') : t('seeSent')}
      </button>
      {#if previewOpen}
        <pre class="preview">{previewText}</pre>
        <p class="privacy">{t('privacy')}</p>
      {/if}
    </section>
  {/if}

  <img class="maison" src="/monogram.png" alt={BRAND.name} />
  <p class="calibre">Calibre {BRAND.calibre}</p>
</main>

<style>

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
    width: 300px;
    padding: 20px 18px 12px;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #1c1917;
    background: #fff;
  }
  .dial-zone {
    text-align: center;
  }
  .status {
    margin: 10px 0 2px;
    font-size: 12.5px;
  }
  .status .ok {
    color: #16a34a;
  }
  .status.warn {
    color: #b45309;
  }
  .offer {
    margin-top: 8px;
    padding: 8px 16px;
    border: 1px solid #1c1917;
    border-radius: 999px;
    background: #1c1917;
    color: #fafaf9;
    font: 500 12.5px/1 ui-sans-serif, system-ui, sans-serif;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .offer:hover {
    transform: translateY(-1px);
  }
  .offer:disabled {
    opacity: 0.6;
  }
  .status.muted,
  .stopped-msg {
    color: #78716c;
  }
  .linklike {
    border: none;
    background: none;
    padding: 0;
    font-size: 11.5px;
    color: #78716c;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .linklike:hover {
    color: #1c1917;
  }
  .complications {
    margin-top: 14px;
    border-top: 1px solid #e7e5e4;
  }
  .inert-zone {
    opacity: 0.4;
    pointer-events: none;
    filter: grayscale(1);
    transition: opacity 0.3s ease;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f4;
    cursor: pointer;
  }
  .row .label {
    font-size: 12px;
    flex: 0 0 auto;
  }
  .row .value {
    flex: 1;
    text-align: right;
    font-size: 11.5px;
    color: #57534e;
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row.off .label {
    color: #a8a29e;
  }
  .row input {
    accent-color: #1c1917;
  }
  .footer {
    margin-top: 12px;
    text-align: center;
  }
  .preview {
    margin: 10px 0 0;
    padding: 10px;
    text-align: left;
    font: 400 10.5px/1.5 ui-monospace, monospace;
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    border-radius: 8px;
    white-space: pre-wrap;
  }
  .privacy {
    margin: 6px 0 0;
    font-size: 10px;
    color: #a8a29e;
  }
  .maison {
    display: block;
    width: 58px;
    margin: 14px auto 0;
    mix-blend-mode: multiply;
    opacity: 0.9;
  }
  .calibre {
    margin: 16px 0 0;
    text-align: center;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d6d3d1;
  }
</style>
