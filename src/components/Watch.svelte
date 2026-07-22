<script lang="ts">
  /**
   * The watch — one component, three personalities, driven entirely by
   * dial tokens (invariant #2: dials never change features, only sensation).
   * Object treatment: real drop shadow, case relief, discreet glass arc.
   */
  import type { DialId } from '../core/settings';
  import { DIAL_TOKENS } from '../shared/dials';

  interface Props {
    now: Date;
    dial?: DialId;
    running?: boolean;
    size?: number;
    showCrown?: boolean;
    introPulse?: boolean;
    oncrown?: () => void;
  }
  const {
    now,
    dial = 'studio',
    running = true,
    size = 150,
    showCrown = false,
    introPulse = false,
    oncrown,
  }: Props = $props();

  const t = $derived(DIAL_TOKENS[dial]);
  const uid = Math.random().toString(36).slice(2, 8);

  const seconds = $derived(now.getSeconds());
  const minutes = $derived(now.getMinutes() + seconds / 60);
  const hours = $derived((now.getHours() % 12) + minutes / 60);
  const hourAngle = $derived(hours * 30);
  const minuteAngle = $derived(minutes * 6);
  const secondAngle = $derived(seconds * 6);

  const ROMANS: Array<[string, number, number]> = [
    ['XII', 100, 34],
    ['III', 168, 106],
    ['VI', 100, 176],
    ['IX', 32, 106],
  ];
</script>

<div class="watch" class:stopped={!running}>
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    aria-hidden="true"
    style="filter: drop-shadow(0 {size / 25}px {size / 11}px rgba(28, 25, 23, 0.28));"
  >
    <defs>
      <clipPath id="face-{uid}"><circle cx="100" cy="100" r="87" /></clipPath>
    </defs>

    <!-- case with relief -->
    <circle cx="100" cy="100" r="97" fill={t.caseColor} />
    <circle cx="100" cy="100" r="97" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />
    <circle cx="100" cy="100" r="91" fill="none" stroke={t.bezel} stroke-width="3" />
    <circle cx="100" cy="100" r="87" fill={t.face} />
    <circle cx="100" cy="100" r="87" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="1" />

    <!-- markers -->
    {#if t.numerals === 'roman'}
      {#each ROMANS as [n, x, y] (n)}
        <text {x} {y} class="roman" fill={t.index}>{n}</text>
      {/each}
      {#each [30, 60, 120, 150, 210, 240, 300, 330] as a (a)}
        <circle cx="100" cy="21" r="1.6" fill={t.index} transform="rotate({a} 100 100)" />
      {/each}
    {:else if t.numerals === 'instrument'}
      {#each Array.from({ length: 60 }, (_, i) => i) as i (i)}
        <line
          x1="100"
          y1="14"
          x2="100"
          y2={i % 5 === 0 ? '24' : '18'}
          stroke={t.index}
          stroke-width={i % 15 === 0 ? 2.4 : i % 5 === 0 ? 1.6 : 0.7}
          opacity={i % 5 === 0 ? 1 : 0.55}
          transform="rotate({i * 6} 100 100)"
        />
      {/each}
    {:else}
      {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
        <line
          x1="100"
          y1="16"
          x2="100"
          y2={i % 3 === 0 ? '28' : '23'}
          stroke={t.index}
          stroke-width="2"
          transform="rotate({i * 30} 100 100)"
        />
      {/each}
    {/if}

    <!-- hands (CSS transforms on groups: reliable transitions) -->
    <g class="hand-g" style="transform: rotate({hourAngle}deg);">
      <line x1="100" y1="100" x2="100" y2="54" stroke={t.hour} stroke-width={t.numerals === 'roman' ? 3.5 : 5} stroke-linecap="round" />
    </g>
    <g class="hand-g" style="transform: rotate({minuteAngle}deg);">
      <line x1="100" y1="100" x2="100" y2="32" stroke={t.minute} stroke-width={t.numerals === 'roman' ? 2.2 : 3} stroke-linecap="round" />
    </g>
    <g class="hand-g second" style="transform: rotate({secondAngle}deg); transition: {running ? t.tick : 'none'};">
      <line x1="100" y1="110" x2="100" y2="24" stroke={t.second} stroke-width="1.2" stroke-linecap="round" />
      <circle cx="100" cy="110" r="3" fill={t.second} />
    </g>
    <circle cx="100" cy="100" r="3.4" fill={t.hour} />
    <circle cx="100" cy="100" r="1.2" fill={t.face} />

    <!-- glass -->
    <g clip-path="url(#face-{uid})" pointer-events="none">
      <ellipse
        cx="66"
        cy="52"
        rx="78"
        ry="36"
        fill="#ffffff"
        opacity={t.glass}
        transform="rotate(-18 66 52)"
      />
    </g>
  </svg>

  {#if showCrown}
    <button
      class="crown"
      class:pulled={!running}
      class:intro={introPulse}
      onclick={oncrown}
      title={running ? 'Pull the crown to stop the watch' : 'Push the crown to restart'}
      aria-label={running ? 'Stop the watch' : 'Restart the watch'}
      style="background: repeating-linear-gradient(to bottom, {t.caseColor} 0 3px, {t.bezel} 3px 5px); border-color: {t.bezel};"
    ></button>
  {/if}
</div>

<style>
  .watch {
    position: relative;
    display: inline-block;
    transition: filter 0.4s ease;
  }
  .watch.stopped {
    filter: grayscale(1) opacity(0.55);
  }
  .roman {
    font: 13px Georgia, 'Times New Roman', serif;
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .hand-g {
    transform-origin: 100px 100px;
    transition: transform 0.4s ease;
  }
  .crown {
    position: absolute;
    right: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 28px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.18);
    transition:
      right 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter 0.2s;
  }
  .crown:hover {
    right: -17px;
    filter: brightness(1.08);
  }
  .crown.pulled {
    right: -22px;
    filter: saturate(0.4) brightness(1.15);
  }
  @media (prefers-reduced-motion: no-preference) {
    .crown.intro {
      animation: crown-hello 0.9s ease-in-out 0.6s 2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hand-g,
    .hand-g.second {
      transition: none !important;
    }
  }
  @keyframes crown-hello {
    0%,
    100% {
      right: -14px;
    }
    50% {
      right: -19px;
    }
  }
</style>
