# Architecture — Calibre 1.0

## Invariants (validated, do not drift)

1. **Provisional name.** The commercial name is not final. All user-facing
   brand strings live in `src/shared/brand.ts`. Nothing else may hardcode a
   product name. Renaming = one file.

2. **Dials are themes, nothing more.** The three dials (Sobre, Paddock,
   Transparente) share **exactly** the same features, components and layout.
   A dial is a design-token set (colors, hands, typography) applied to one
   single UI. There is one popup, one pastille, one onboarding — never three.

3. **Generic-first adapters.** The generic adapter is not a fallback: it is
   the primary abstraction and the project's long-term survival strategy
   (future AI interfaces will appear faster than we can write adapters).
   Named adapters (chatgpt, claude, …) are thin specializations that override
   only what the generic heuristics cannot guess (editor quirks, send
   triggers). Design rule: every improvement should land in the generic
   layer first if possible.

4. **Zero network.** No fetch, no telemetry, no CDN, no remote code. Future
   complications that require network (weather…) will be explicit opt-in and
   are out of scope for Calibre 1.0.

5. **Honest injection.** The block is sent visibly (no hidden characters, no
   request tampering). Elegance comes from on-page presentation (pastille),
   not from concealment.

6. **Identity rule — the admission test for ANY future feature.**
   *"Does it give the AI temporal context, or date the work done with it?
   If neither, it is not a complication — it is a different extension."*
   Passes: active time, thread info, download date-stamping. Fails: prompt
   libraries, conversation exporters, grammar tools. When in doubt, refuse.
   AI-Watch stays a watch.

## Layers

- `src/core/` — pure logic, no DOM, no browser APIs. Fully unit-tested.
  Complications registry, template renderer, session tracker, settings.
- `src/adapters/` — per-site DOM integration behind one `SiteAdapter`
  interface. Disposable by design; breakage is isolated here.
- `src/entrypoints/` — WXT entrypoints (background, popup, content, options).
  Thin; they wire core + adapters + UI.
- `src/shared/` — brand, i18n, constants.

## Vocabulary (code and UI share it) — FROZEN

The lexicon is complete: Watch, Wrist, Crown, Workshop, Calibre,
Complication, Dial, Gravure, Remontoir, Transparence, Pastille.
No new terms may be coined. Great houses deepen their concepts;
they do not add one per release.

| Concept | Name |
| --- | --- |
| Context module | Complication |
| Theme/preset | Dial (cadran) |
| Master switch | Crown (couronne) |
| Options page | Atelier |
| Release/version | Calibre |
| Changelog | Carnet d'entretien |
| Broken adapter state | "The watch stopped" (orange badge) |
| Generic adapter (user-facing) | NEVER "generic"/"heuristics" — say "The watch adapts itself." |
| Opt-in on unknown sites | The Free Wrist — button "Offer this AI a watch" |

## Settings

Versioned schema in `src/core/settings.ts`. `migrate()` is the only entry
point for stored data; corrupt data falls back to defaults, never crashes.
