import {
  KEEPALIVE_PORT_PREP_KIND,
  PROMPT_HUB_KEEPALIVE_PORT,
  type CtxMenuPrepPayload,
} from '@/lib/keepalivePort';
import { postToTab } from './tabMessaging';
import { runExtraction } from './extraction';

const MENU_ID_ADD_REF = 'extract-image-prompt-add-ref';
const MENU_DIRECT_EXTRACT = 'extract-image-prompt-direct-extract';
const MENU_ADD_VIDEO_REF = 'extract-image-prompt-add-video-ref';
const MENU_FALLBACK_ADD = 'extract-image-prompt-fb-add';
const MENU_FALLBACK_EXTRACT = 'extract-image-prompt-fb-direct-extract';
const MENU_FALLBACK_ADD_VIDEO_REF = 'extract-image-prompt-fb-add-video-ref';
const MENU_REGION_SNIP = 'extract-region-snip-add-ref';

const pendingTabExtract = new Map<number, { imageUrl: string; at: number; videoIndex?: number }>();

const NATIVE_PREP_TTL_MS = 10_000;

const keepalivePortsByTab = new Map<number, Set<chrome.runtime.Port>>();
const keepalivePortsWithoutTab = new Set<chrome.runtime.Port>();

export function applyCtxMenuPrep(tabId: number, payload: CtxMenuPrepPayload): void {
  const { extractionUrl, showFallback, videoIndex } = payload;
  const hasVideoIndex = videoIndex != null && videoIndex >= 0;
  if (extractionUrl || hasVideoIndex) {
    pendingTabExtract.set(tabId, {
      imageUrl: extractionUrl,
      at: Date.now(),
      ...(hasVideoIndex ? { videoIndex } : {}),
    });
  } else {
    pendingTabExtract.delete(tabId);
  }
  const showItems = showFallback && !!extractionUrl;
  chrome.contextMenus.update(MENU_FALLBACK_ADD, { visible: showItems }, () => {
    void chrome.runtime.lastError;
  });
  chrome.contextMenus.update(MENU_FALLBACK_EXTRACT, { visible: showItems }, () => {
    void chrome.runtime.lastError;
  });
  chrome.contextMenus.update(
    MENU_FALLBACK_ADD_VIDEO_REF,
    { visible: showFallback && hasVideoIndex },
    () => {
      void chrome.runtime.lastError;
    },
  );
}

function peekFreshPendingRow(
  tabId: number,
): { imageUrl: string; at: number; videoIndex?: number } | undefined {
  const row = pendingTabExtract.get(tabId);
  if (!row) return;
  if (Date.now() - row.at > NATIVE_PREP_TTL_MS) return;
  return row;
}

function peekFreshPendingExtract(tabId: number): string | undefined {
  return peekFreshPendingRow(tabId)?.imageUrl;
}

function peekFreshPendingVideoIndex(tabId: number): number | undefined {
  const idx = peekFreshPendingRow(tabId)?.videoIndex;
  if (idx == null || idx < 0) return;
  return idx;
}

function looksLikeVideoMenuSrcUrl(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.trim();
  if (u.startsWith('blob:')) return true;
  if (u.startsWith('data:video/')) return true;
  const head = u.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (/\.(m3u8|mp4|webm|m4v|mov|mkv|ogv|m4p)(\s*$)/i.test(head)) return true;
  return /^https?:\/\/[^/]+\/[^?#]*\.(mp4|webm|m3u8)($|[?#])/i.test(u);
}

function resolveUrlForNativeContextMenu(tabId: number, srcUrl: string | undefined): string {
  const pending = peekFreshPendingExtract(tabId)?.trim();
  if (pending) {
    if (pending.startsWith('data:image/jpeg')) return pending;
    if (looksLikeVideoMenuSrcUrl(srcUrl)) return pending;
  }
  return srcUrl || '';
}

function registerKeepalivePort(port: chrome.runtime.Port): void {
  const tabId = port.sender?.tab?.id;
  if (tabId != null) {
    let set = keepalivePortsByTab.get(tabId);
    if (!set) {
      set = new Set();
      keepalivePortsByTab.set(tabId, set);
    }
    set.add(port);
  } else {
    keepalivePortsWithoutTab.add(port);
  }
  port.onDisconnect.addListener(() => {
    void chrome.runtime.lastError;
    const tid = port.sender?.tab?.id;
    if (tid != null) {
      const set = keepalivePortsByTab.get(tid);
      if (set) {
        set.delete(port);
        if (set.size === 0) keepalivePortsByTab.delete(tid);
      }
    } else {
      keepalivePortsWithoutTab.delete(port);
    }
  });
}

export function registerKeepaliveConnectListener(): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PROMPT_HUB_KEEPALIVE_PORT) return;
    registerKeepalivePort(port);

    port.onMessage.addListener((msg: unknown) => {
      if (!msg || typeof msg !== 'object') return;
      const m = msg as { kind?: string; payload?: unknown };
      if (m.kind !== KEEPALIVE_PORT_PREP_KIND) return;
      const tabId = port.sender?.tab?.id;
      if (tabId == null) return;
      const p = m.payload as {
        extractionUrl?: unknown;
        showFallback?: unknown;
        videoIndex?: unknown;
      };
      const extractionUrl = typeof p.extractionUrl === 'string' ? p.extractionUrl : '';
      const showFallback = p.showFallback === true;
      const videoIndex =
        typeof p.videoIndex === 'number' && Number.isInteger(p.videoIndex) && p.videoIndex >= 0
          ? p.videoIndex
          : undefined;
      applyCtxMenuPrep(tabId, { extractionUrl, showFallback, videoIndex });
    });
  });
}

export function ensureContextMenus(): void {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    void chrome.runtime.lastError;
    chrome.contextMenus.create(
      { id: MENU_ID_ADD_REF, title: '添加参考', contexts: ['image', 'video'] },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      { id: MENU_DIRECT_EXTRACT, title: '提取提示词', contexts: ['image', 'video'] },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      { id: MENU_ADD_VIDEO_REF, title: '添加视频参考', contexts: ['video'] },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      {
        id: MENU_FALLBACK_ADD,
        title: '添加参考',
        contexts: ['page', 'frame', 'link', 'selection', 'editable'],
        visible: false,
      },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      {
        id: MENU_FALLBACK_EXTRACT,
        title: '提取提示词',
        contexts: ['page', 'frame', 'link', 'selection', 'editable'],
        visible: false,
      },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      {
        id: MENU_FALLBACK_ADD_VIDEO_REF,
        title: '添加视频参考',
        contexts: ['page', 'frame', 'link', 'selection', 'editable'],
        visible: false,
      },
      () => void chrome.runtime.lastError,
    );
    chrome.contextMenus.create(
      {
        id: MENU_REGION_SNIP,
        title: '截取添加参考',
        contexts: ['page', 'frame', 'link', 'selection', 'editable'],
      },
      () => void chrome.runtime.lastError,
    );
  });
}

function hideFallbackContextMenus(): void {
  chrome.contextMenus.update(MENU_FALLBACK_ADD, { visible: false }, () => {
    void chrome.runtime.lastError;
  });
  chrome.contextMenus.update(MENU_FALLBACK_EXTRACT, { visible: false }, () => {
    void chrome.runtime.lastError;
  });
  chrome.contextMenus.update(MENU_FALLBACK_ADD_VIDEO_REF, { visible: false }, () => {
    void chrome.runtime.lastError;
  });
}

export function clearTabContextMenuState(tabId: number): void {
  pendingTabExtract.delete(tabId);
}

export function registerContextMenuClickListener(): void {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;

    if (info.menuItemId === MENU_ID_ADD_REF) {
      const imageUrl = resolveUrlForNativeContextMenu(tab.id, info.srcUrl);
      if (!imageUrl) return;
      postToTab(tab.id, { type: 'PANEL_APPEND_REFERENCE', payload: { imageUrl } });
      return;
    }

    if (info.menuItemId === MENU_DIRECT_EXTRACT) {
      const imageUrl = resolveUrlForNativeContextMenu(tab.id, info.srcUrl);
      if (!imageUrl) return;
      void runExtraction({
        tabId: tab.id,
        imageUrls: [imageUrl],
        pageUrl: tab.url ?? '',
        pageTitle: tab.title ?? '',
      });
      return;
    }

    if (info.menuItemId === MENU_FALLBACK_ADD) {
      const cached = pendingTabExtract.get(tab.id);
      pendingTabExtract.delete(tab.id);
      hideFallbackContextMenus();
      const imageUrl = cached?.imageUrl || info.srcUrl || info.linkUrl || '';
      if (!imageUrl) return;
      postToTab(tab.id, { type: 'PANEL_APPEND_REFERENCE', payload: { imageUrl } });
      return;
    }

    if (info.menuItemId === MENU_FALLBACK_EXTRACT) {
      const cached = pendingTabExtract.get(tab.id);
      pendingTabExtract.delete(tab.id);
      hideFallbackContextMenus();
      const imageUrl = cached?.imageUrl || info.srcUrl || info.linkUrl || '';
      if (!imageUrl) return;
      void runExtraction({
        tabId: tab.id,
        imageUrls: [imageUrl],
        pageUrl: tab.url ?? '',
        pageTitle: tab.title ?? '',
      });
      return;
    }

    if (info.menuItemId === MENU_ADD_VIDEO_REF || info.menuItemId === MENU_FALLBACK_ADD_VIDEO_REF) {
      if (info.menuItemId === MENU_FALLBACK_ADD_VIDEO_REF) {
        hideFallbackContextMenus();
      }
      const videoIndex = peekFreshPendingVideoIndex(tab.id);
      postToTab(tab.id, {
        type: 'PANEL_OPEN_VIDEO_REFERENCE',
        payload: { ...(videoIndex != null ? { videoIndex } : {}) },
      });
      return;
    }

    if (info.menuItemId === MENU_REGION_SNIP) {
      postToTab(tab.id, { type: 'START_REGION_CAPTURE', payload: {} });
    }
  });
}
