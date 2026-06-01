import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSettings,
  saveSettings,
  getHistoryItem,
  appendPromptVersion,
  restorePromptVersion,
  removePromptVersion,
  runRefine,
  runExtraction,
  applyCtxMenuPrep,
  relayRegionCaptureToFocusedWebTab,
  handleRegionCaptureConfirm,
  fetchProviderQuota,
  runUpdateCheck,
  applyStoreExtensionUpdate,
  refreshRemoteRuntimeConfigNow,
  normalizeReferenceList,
  parseRegionCaptureConfirmPayload,
} = vi.hoisted(() => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  getHistoryItem: vi.fn(),
  appendPromptVersion: vi.fn(),
  restorePromptVersion: vi.fn(),
  removePromptVersion: vi.fn(),
  runRefine: vi.fn(),
  runExtraction: vi.fn(),
  applyCtxMenuPrep: vi.fn(),
  relayRegionCaptureToFocusedWebTab: vi.fn(),
  handleRegionCaptureConfirm: vi.fn(),
  fetchProviderQuota: vi.fn(),
  runUpdateCheck: vi.fn(),
  applyStoreExtensionUpdate: vi.fn(),
  refreshRemoteRuntimeConfigNow: vi.fn(),
  normalizeReferenceList: vi.fn((urls: string[]) => urls),
  parseRegionCaptureConfirmPayload: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  getSettings,
  saveSettings,
  getHistoryItem,
  appendPromptVersion,
  restorePromptVersion,
  removePromptVersion,
}));
vi.mock('@/lib/referenceImages', () => ({ normalizeReferenceList }));
vi.mock('@/lib/regionCaptureCrop', () => ({ parseRegionCaptureConfirmPayload }));
vi.mock('@/lib/applyExtensionUpdate', () => ({ applyStoreExtensionUpdate }));
vi.mock('@/lib/remoteRuntimeConfig', () => ({ refreshRemoteRuntimeConfigNow }));
vi.mock('@/lib/quota/fetch', () => ({ fetchProviderQuota }));
vi.mock('./context-menu', () => ({ applyCtxMenuPrep }));
vi.mock('./extraction', () => ({
  parsePayloadVideoSegment: vi.fn(),
  runExtraction,
}));
vi.mock('./refine', () => ({ runRefine }));
vi.mock('./regionCapture', () => ({
  handleRegionCaptureConfirm,
  relayRegionCaptureToFocusedWebTab,
}));
vi.mock('./tabMessaging', () => ({
  findTabByUrl: vi.fn(),
  pickPanelTargetTab: vi.fn(),
  sendToTabReliably: vi.fn(),
  waitForTabComplete: vi.fn(),
}));
vi.mock('./updater', () => ({
  runUpdateCheck,
  DEFAULT_FEED_URL: 'https://example.com/feed.json',
}));

import { registerRuntimeMessageListener } from './messages';

type MessageHandler = (
  message: { type?: string; payload?: unknown },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

let onMessageHandler: MessageHandler;

function installChromeStub() {
  const tabsQuery = vi.fn((_q: unknown, cb: (tabs: chrome.tabs.Tab[]) => void) => cb([]));
  vi.stubGlobal('chrome', {
    runtime: {
      getURL: (p: string) => `chrome-extension://test/${p}`,
      openOptionsPage: vi.fn(),
      reload: vi.fn(),
      onMessage: {
        addListener: (fn: MessageHandler) => {
          onMessageHandler = fn;
        },
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: tabsQuery,
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
    },
    windows: { update: vi.fn() },
  });
}

function dispatch(
  message: { type: string; payload?: unknown },
  sender: Partial<chrome.runtime.MessageSender> = {},
) {
  const fullSender = {
    tab: { id: 42, url: 'https://a.test', title: 'T' } as chrome.tabs.Tab,
    ...sender,
  } as chrome.runtime.MessageSender;
  const sendResponse = vi.fn();
  const keepOpen = onMessageHandler(message, fullSender, sendResponse);
  return { keepOpen, sendResponse };
}

describe('registerRuntimeMessageListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installChromeStub();
    registerRuntimeMessageListener();
    getSettings.mockResolvedValue({
      promptStrategy: 'v0.3.0',
      oneClickRewriteRandomness: 'moderate',
    });
    saveSettings.mockResolvedValue(undefined);
    getHistoryItem.mockResolvedValue({ id: 'h1', prompt: 'p', pageUrl: 'https://a.test' });
    appendPromptVersion.mockResolvedValue({ id: 'h1' });
    restorePromptVersion.mockResolvedValue({ id: 'h1' });
    removePromptVersion.mockResolvedValue({ id: 'h1' });
    runRefine.mockResolvedValue({ ok: true, prompt: 'refined' });
    relayRegionCaptureToFocusedWebTab.mockResolvedValue({ ok: true });
    fetchProviderQuota.mockResolvedValue({ providerId: 'openai', used: 1, limit: 10 });
    runUpdateCheck.mockResolvedValue({ hasUpdate: false });
    applyStoreExtensionUpdate.mockResolvedValue({ applied: false, reason: 'already_latest' });
    refreshRemoteRuntimeConfigNow.mockResolvedValue(undefined);
    parseRegionCaptureConfirmPayload.mockReturnValue({ x: 0, y: 0, width: 10, height: 10 });
    normalizeReferenceList.mockImplementation((urls: string[]) => urls);
  });

  it('returns false for unknown message types', () => {
    const { keepOpen } = dispatch({ type: 'UNKNOWN_TYPE' });
    expect(keepOpen).toBe(false);
  });

  it('OPEN_OPTIONS without tab calls openOptionsPage and keeps channel open', () => {
    const { keepOpen, sendResponse } = dispatch({ type: 'OPEN_OPTIONS', payload: {} });
    expect(keepOpen).toBe(true);
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('SET_PROMPT_STRATEGY saves settings asynchronously', async () => {
    const { keepOpen, sendResponse } = dispatch({
      type: 'SET_PROMPT_STRATEGY',
      payload: { strategy: 'v0.3.0' },
    });
    expect(keepOpen).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true }));
    expect(saveSettings).toHaveBeenCalled();
  });

  it('SET_PROMPT_STRATEGY rejects missing strategy', () => {
    const { sendResponse } = dispatch({ type: 'SET_PROMPT_STRATEGY', payload: {} });
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: '缺少 strategy' });
  });

  it('GET_HISTORY_ITEM delegates to storage', async () => {
    const item = { id: 'h1' };
    getHistoryItem.mockResolvedValue(item);
    const { keepOpen, sendResponse } = dispatch({
      type: 'GET_HISTORY_ITEM',
      payload: { id: 'h1' },
    });
    expect(keepOpen).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true, item }));
  });

  it('REFINE_PROMPT delegates to runRefine', async () => {
    const { keepOpen, sendResponse } = dispatch({
      type: 'REFINE_PROMPT',
      payload: { historyId: 'h1', instruction: 'x', current: 'text' },
    });
    expect(keepOpen).toBe(true);
    await vi.waitFor(() =>
      expect(runRefine).toHaveBeenCalledWith('h1', 'text', 'x', 42, undefined),
    );
    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, prompt: 'refined' }),
    );
  });

  it('CTX_MENU_PREP calls applyCtxMenuPrep when tab id present', () => {
    const { keepOpen, sendResponse } = dispatch({
      type: 'CTX_MENU_PREP',
      payload: { extractionUrl: 'https://img.test/a.png' },
    });
    expect(keepOpen).toBe(true);
    expect(applyCtxMenuPrep).toHaveBeenCalledWith(42, {
      extractionUrl: 'https://img.test/a.png',
      showFallback: false,
      videoIndex: undefined,
    });
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('EXTRACT_PROMPT calls runExtraction with normalized urls', () => {
    const { keepOpen, sendResponse } = dispatch({
      type: 'EXTRACT_PROMPT',
      payload: { imageUrls: ['https://img.test/a.png'], pageUrl: 'https://a.test' },
    });
    expect(keepOpen).toBe(true);
    expect(runExtraction).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  it('EXTRACT_PROMPT rejects missing tab or images', () => {
    const { sendResponse } = dispatch(
      { type: 'EXTRACT_PROMPT', payload: { imageUrls: [] } },
      { tab: undefined },
    );
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'invalid params' });
  });

  it('REGION_CAPTURE_CONFIRM returns false when payload invalid', () => {
    parseRegionCaptureConfirmPayload.mockReturnValue(null);
    const { keepOpen, sendResponse } = dispatch({ type: 'REGION_CAPTURE_CONFIRM', payload: {} });
    expect(keepOpen).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, error: 'invalid' });
  });

  it('REQUEST_REGION_CAPTURE relays to focused tab', async () => {
    const { keepOpen, sendResponse } = dispatch({ type: 'REQUEST_REGION_CAPTURE' });
    expect(keepOpen).toBe(true);
    await vi.waitFor(() => expect(relayRegionCaptureToFocusedWebTab).toHaveBeenCalled());
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true }));
  });
});
