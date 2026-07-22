import { defineConfig } from 'wxt';

// NOTE: Display brand ("AI-Watch") lives in src/shared/brand.ts and is used
// inside the UI (popup title, alt text). The manifest name/description below
// are the store-facing listing text (Chrome Web Store / AMO) — finalized
// 20 July 2026 as "AI-Watch Clock" to avoid a name collision with an
// unrelated Android app and an unrelated April 2026 trademark filing.
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'AI-Watch Clock',
    description:
      'Give your AI a watch. Time awareness for ChatGPT, Claude, Gemini and any AI \u2014 100% local, zero network.',
    // Step 2: "storage" only (settings + per-site session state, all local).
    // host access comes from the content script matches, nothing broader.
    permissions: ['storage', 'activeTab', 'scripting'],
    // The Free Wrist: no broad host access. Each origin is granted one by
    // one, by the user, at the moment they "offer this AI a watch".
    optional_host_permissions: ['https://*/*', 'http://*/*'],
  },
});
