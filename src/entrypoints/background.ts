export default defineBackground(() => {
  // Intentionally minimal. The background never makes network requests.
  // Later steps: action badge states (running / paused / stopped-orange).
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== 'install') return;
    void (async () => {
      const flag = await browser.storage.local.get('unboxing-opened');
      if (flag['unboxing-opened']) return;
      await browser.storage.local.set({ 'unboxing-opened': true });
      await browser.tabs.create({ url: browser.runtime.getURL('/unboxing.html') });
    })();
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if ((message as { type?: string } | null)?.type === 'open-workshop') {
      void browser.runtime.openOptionsPage();
    }
  });
});
