import { installSurfaceErrorLogger } from '@/lib/surfaceErrorLogger';
import { refreshRemoteRuntimeConfigNow } from '@/lib/remoteRuntimeConfig';
import { ensureLibraryReady } from '@/lib/storage/history';
import { getCurrentVersion } from '@/lib/updater';
import { installDataDirectoryAutoSync } from './dataDirectorySync';
import {
  clearTabContextMenuState,
  ensureContextMenus,
  registerContextMenuClickListener,
  registerKeepaliveConnectListener,
} from './context-menu';
import { clearTabExtractionGeneration } from './extraction';
import { registerRuntimeMessageListener } from './messages';
import { relayRegionCaptureToFocusedWebTab } from './regionCapture';
import { installRefineProgressPortHub } from './refineProgressPortHub';

registerKeepaliveConnectListener();
installSurfaceErrorLogger('background');
installRefineProgressPortHub();
registerContextMenuClickListener();
registerRuntimeMessageListener();

chrome.runtime.onInstalled.addListener((details) => {
  ensureContextMenus();
  void ensureLibraryReady().catch(() => undefined);
  void refreshRemoteRuntimeConfigNow().catch(() => undefined);
  if (details.reason === 'install') {
    try {
      chrome.runtime.openOptionsPage();
    } catch {
      /* ignore */
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenus();
  void ensureLibraryReady().catch(() => undefined);
  void refreshRemoteRuntimeConfigNow().catch(() => undefined);
});

chrome.commands.onCommand.addListener((cmd) => {
  if (cmd !== 'region-capture-add-ref') return;
  void relayRegionCaptureToFocusedWebTab().then((r) => {
    if (!r.ok) console.warn('[PromptHub] region capture shortcut:', r.error);
  });
});

chrome.tabs?.onRemoved.addListener((tabId) => {
  clearTabContextMenuState(tabId);
  clearTabExtractionGeneration(tabId);
});

installDataDirectoryAutoSync();
ensureContextMenus();

(globalThis as unknown as { __imagePromptVersion?: string }).__imagePromptVersion =
  getCurrentVersion();
