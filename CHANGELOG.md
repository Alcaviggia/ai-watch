# Changelog

## 1.0.26 — 2026-07-22

- Fix: the em dash in the manifest description and in `BRAND.calibre` had
  been corrupted to the literal text "2014" (a `\u2014` escape that lost its
  backslash somewhere upstream). Both are now proper `—` characters,
  verified byte-for-byte in the built manifest.
- `BRAND.calibre` updated from `"1.0 — GM candidate"` to `"1.0 — GM"` now
  that this build has actually shipped.
- Added the missing extension icons (`icon-16/32/48/128.png`) to `public/`
  — present in the shipped store builds but absent from this source
  snapshot; restored from the audited release artifact.
- `package.json` and `wxt.config.ts` brought up to date: version `1.0.26`,
  store name `AI-Watch Clock`, display name `AI-Watch` (unchanged).
- README rewritten to drop the Step 0 / provisional-name framing now that
  the product has shipped.

## 1.0.23 — GM candidate

- Calibre 1.0 GM candidate. 46/46 tests, full adapter set (ChatGPT, Claude,
  Gemini, Mistral, Perplexity, Grok), three dial collections, i18n in 8
  languages, first-gift prompt, zero network requests.
