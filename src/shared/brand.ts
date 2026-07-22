/**
 * BRAND — single source of truth for the product name.
 *
 * Display name is FINAL: "AI-Watch" (decided 20 July 2026). The Chrome/AMO
 * store listing name is "AI-Watch Clock" (see wxt.config.ts) to avoid a
 * collision with an unrelated Android app and an unrelated April 2026
 * trademark filing; the domain ai-watch.eu predates both. Renaming remains
 * a one-file change by architecture. Watchmaking vocabulary (complications,
 * calibre, atelier…) is part of the product identity and is NOT tied to
 * the name.
 */
export const BRAND = {
  /** Display name, used inside the extension UI. */
  name: 'AI-Watch',
  /** Version vocabulary: releases are "Calibres". */
  calibre: '1.0 \u2014 GM',
  tagline: {
    en: 'Give your AI a watch.',
    fr: 'Offrez une montre à votre IA.',
  },
} as const;
