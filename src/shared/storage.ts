import { migrate, type Settings } from '../core/settings';
import { initialWristState, type WristState } from '../core/session-tracker';

/**
 * chrome.storage.local wiring. The ONLY persistence in the product —
 * local by design, synced nowhere.
 */

export async function loadSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get('settings');
  return migrate(stored['settings']);
}

export function onSettingsChanged(callback: (s: Settings) => void): void {
  browser.storage.local.onChanged.addListener((changes) => {
    if (changes['settings']) callback(migrate(changes['settings'].newValue));
  });
}

export async function loadWrist(siteId: string): Promise<WristState> {
  const key = `wrist:${siteId}`;
  const stored = await browser.storage.local.get(key);
  const value = stored[key] as WristState | undefined;
  return value ?? initialWristState();
}

export async function saveWrist(siteId: string, state: WristState): Promise<void> {
  await browser.storage.local.set({ [`wrist:${siteId}`]: state });
}
