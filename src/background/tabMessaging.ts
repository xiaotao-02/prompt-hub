import type { RuntimeMessage } from '@/lib/types';

export function sendTabMessageOk(tabId: number, message: RuntimeMessage): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, message, () => {
        resolve(!chrome.runtime.lastError);
      });
    } catch {
      resolve(false);
    }
  });
}

export function pingTab(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, () => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendToTabReliably(
  tabId: number,
  message: RuntimeMessage,
  maxAttempts = 8,
  intervalMs = 150,
): Promise<boolean> {
  const INJECT_AFTER_ATTEMPTS = 3;
  let programmaticInjected = false;

  for (let i = 0; i < maxAttempts; i++) {
    const alive = await pingTab(tabId);
    if (alive) {
      const sent = await sendTabMessageOk(tabId, message);
      if (sent) return true;
    } else if (i >= INJECT_AFTER_ATTEMPTS && !programmaticInjected) {
      programmaticInjected = true;
      await injectContentScript(tabId);
    }
    await sleep(intervalMs);
  }
  const finalOk = await sendTabMessageOk(tabId, message);
  if (!finalOk) {
    console.warn('[PromptHub] sendToTabReliably: final send failed', tabId);
  }
  return finalOk;
}

export function postToTab(tabId: number, message: RuntimeMessage): void {
  try {
    chrome.tabs.sendMessage(tabId, message, () => {
      const err = chrome.runtime.lastError;
      if (!err) return;
      void injectContentScript(tabId).then((ok) => {
        if (!ok) {
          console.warn('[PromptHub] postToTab fallback inject failed:', err.message);
          return;
        }
        chrome.tabs.sendMessage(tabId, message, () => void chrome.runtime.lastError);
      });
    });
  } catch (err) {
    console.warn('[PromptHub] postToTab threw synchronously', err);
  }
}

export async function findTabByUrl(targetUrl: string): Promise<chrome.tabs.Tab | null> {
  try {
    const urlObj = new URL(targetUrl);
    const canonical = urlObj.origin + urlObj.pathname + urlObj.search;
    const all = await chrome.tabs.query({});
    const matches = all.filter((t) => {
      if (!t.url) return false;
      try {
        const u = new URL(t.url);
        return u.origin + u.pathname + u.search === canonical;
      } catch {
        return false;
      }
    });
    if (matches.length === 0) return null;
    const active = matches.find((t) => t.active);
    if (active) return active;
    matches.sort((a, b) => {
      const la = (a as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed || 0;
      const lb = (b as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed || 0;
      return lb - la;
    });
    return matches[0];
  } catch {
    return null;
  }
}

export async function pickPanelTargetTab(): Promise<chrome.tabs.Tab | null> {
  const isInjectable = (url?: string): boolean => {
    if (!url) return false;
    return /^(https?:|file:|ftp:)/.test(url);
  };

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (activeTab && isInjectable(activeTab.url)) return activeTab;
  } catch {
    /* ignore */
  }

  try {
    const all = await chrome.tabs.query({});
    const candidates = all
      .filter((t) => isInjectable(t.url))
      .sort((a, b) => {
        const la = (a as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed || 0;
        const lb = (b as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed || 0;
        return lb - la;
      });
    return candidates[0] || null;
  } catch {
    return null;
  }
}

export function waitForTabComplete(tabId: number, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') done();
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab?.status === 'complete') done();
      })
      .catch(() => done());
    setTimeout(done, timeoutMs);
  });
}

function getDeclarativeContentScriptFiles(): string[] {
  const m = chrome.runtime.getManifest() as chrome.runtime.ManifestV3;
  const js = m.content_scripts?.[0]?.js;
  return Array.isArray(js) ? js : [];
}

async function injectContentScript(tabId: number): Promise<boolean> {
  const files = getDeclarativeContentScriptFiles();
  if (files.length === 0) {
    console.warn('[PromptHub] injectContentScript: manifest has no content_scripts[0].js');
    return false;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files,
    });
    return true;
  } catch (err) {
    console.warn('[PromptHub] inject content script failed', err);
    return false;
  }
}
